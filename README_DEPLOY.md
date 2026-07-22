# Docker Deployment

## Overview

This deployment setup uses:

- `docker-compose.deploy.yml`
- published Docker Hub images
- `postgres:16` for the database
- MinIO for S3-compatible object storage
- nginx inside the published frontend image to proxy `/api` to `backend:3000`

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

- `DOCKERHUB_USERNAME`
- `APP_VERSION`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `FRONTEND_PORT`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `MINIO_API_PORT`
- `MINIO_CONSOLE_PORT`
- `OBJECT_STORAGE_PUBLIC_ENDPOINT`
- `S3_REGION`
- `S3_ASSETS_BUCKET`
- `S3_FONTS_BUCKET`
- `S3_EXPORTS_BUCKET`
- `AI_PROVIDER_URL`
- `AI_PROVIDER_MODEL`
- `AI_PROVIDER_CLIENT_ID`
- `AI_PROVIDER_CLIENT_SECRET`
- `CORS_ALLOWED_ORIGINS`

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
docker compose -f docker-compose.deploy.yml --env-file .env.deploy pull
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
```

`database/seed.sql` bootstraps the relational catalog required by the application, including `font_groups`, `brand_kit`, `template_states`, and `export_types`.

## Validate Access

Open:

- `http://localhost:${FRONTEND_PORT}`
- or `http://SERVER:${FRONTEND_PORT}`
- `OBJECT_STORAGE_PUBLIC_ENDPOINT`
- `http://localhost:${MINIO_CONSOLE_PORT}`
- or `http://SERVER:${MINIO_CONSOLE_PORT}`

The frontend serves the SPA and proxies:

- browser request `/api/health`
- internal upstream `http://backend:3000/health`

The backend also signs object storage URLs for the browser with `OBJECT_STORAGE_PUBLIC_ENDPOINT`.
For local testing, set it to `http://localhost:${MINIO_API_PORT}`.
For a remote server, set it to the public host that the browser can reach, for example `http://SERVER:${MINIO_API_PORT}`.

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
```

## Notes

- `docker-compose.deploy.yml` uses `image:`, not local `build:`.
- `docker-compose.yaml` remains the local development compose.
- MinIO replaces Supabase Storage in this deployment setup.
- Buckets are created automatically by `minio-init`.
- Buckets are private by default.
- The frontend image must be published after building it with `VITE_API_BASE_URL=/api`.
- `OBJECT_STORAGE_ENDPOINT` stays internal to Docker as `http://minio:9000`; `OBJECT_STORAGE_PUBLIC_ENDPOINT` is the browser-facing object storage URL used in signed asset previews.
- Binary asset seeding is intentionally disabled in this case-study branch.
- PostgreSQL stores metadata only; binary content stays in MinIO.
