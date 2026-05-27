# Docker Deployment

## Overview

This deployment setup uses:

- `docker-compose.deploy.yml`
- published Docker Hub images
- `postgres:16` for the database
- MinIO for S3-compatible object storage
- nginx inside the frontend container to proxy `/api` to `backend:3000`

The backend is not exposed publicly by default. The browser talks to the frontend, and the frontend container forwards API traffic internally.

## Files For The Client

- `docker-compose.deploy.yml`
- `.env.deploy.example`
- `database/init.sql`
- `database/seed.sql`
- `README_DEPLOY.md`

## Prepare Environment

Copy the deployment environment file:

```bash
cp .env.deploy.example .env.deploy
```

Complete these values in `.env.deploy`:

- `POSTGRES_PASSWORD`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `DOCKERHUB_USERNAME`
- `APP_VERSION`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`

`APP_VERSION` can be:

- `latest`
- a commit SHA
- a version tag such as `v1.0.0`

If the images are private:

```bash
docker login
```

## Start The Stack

```bash
docker compose -f docker-compose.deploy.yml --env-file .env pull
docker compose -f docker-compose.deploy.yml --env-file .env.deploy up -d
```

Check status:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy ps
```

View backend logs:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy logs backend
```

MinIO ports:

- API `9000`
- Console `9001`

## Initialize The Database

Run these commands only the first time, when PostgreSQL is empty:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/init.sql
docker compose -f docker-compose.deploy.yml --env-file .env.deploy exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/seed.sql
docker compose -f docker-compose.deploy.yml --env-file .env.deploy --profile seed up assets-seed
```

`database/seed.sql` bootstraps the relational catalog required by the binary catalog seed, including `font_groups`, `brand_kit`, `template_states`, and `export_types`.

## Validate Access

Open:

- `http://localhost:${FRONTEND_PORT}`
- or `http://SERVER:${FRONTEND_PORT}`
- `http://localhost:${MINIO_CONSOLE_PORT}`
- or `http://SERVER:${MINIO_CONSOLE_PORT}`

The frontend serves the SPA and proxies:

- browser request `/api/health`
- internal upstream `http://backend:3000/health`

Validate MinIO:

- sign in with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
- confirm that these private buckets exist:
- `ai-newsletter-assets`
- `ai-newsletter-fonts`
- `ai-newsletter-exports`

MinIO bucket commands:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy up -d minio minio-init
docker compose -f docker-compose.deploy.yml --env-file .env.deploy logs minio-init
docker compose -f docker-compose.deploy.yml --env-file .env.deploy --profile seed up assets-seed
```

## Notes

- `docker-compose.deploy.yml` uses `image:`, not local `build:`.
- `docker-compose.yaml` remains the local development compose.
- MinIO replaces Supabase Storage in this deployment setup.
- Buckets are created automatically by `minio-init`.
- Buckets are private by default.
- `assets-seed` uploads the catalog from `backend/assets` and reflects it into PostgreSQL.
- PostgreSQL stores metadata only; binary content stays in MinIO.
