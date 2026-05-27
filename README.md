# AI Newsletter

Application for creating and managing internal newsletters with a React frontend, a NestJS backend, Prisma 7, and a local PostgreSQL database for development.

## English

### Project Structure

```txt
.
|-- backend/                 # NestJS API
|   |-- prisma/              # Prisma schema and config
|   |-- src/
|   |   |-- prisma/          # PrismaModule and PrismaService
|   |   `-- ...
|   |-- Dockerfile
|   |-- package.json
|   `-- pnpm-lock.yaml
|-- frontend/                # React + Vite + MUI app
|   |-- src/
|   |-- Dockerfile
|   |-- package.json
|   `-- pnpm-lock.yaml
|-- database/
|   |-- init.sql             # Executable local schema
|   `-- seed.sql             # Foundational relational seed data
|-- .github/workflows/
|-- docker-compose.yaml
|-- docker-compose.deploy.yml
|-- .env.deploy.example
|-- README_DEPLOY.md
`-- README.md
```

### Local Development Stack

- PostgreSQL 16 in Docker Compose
- MinIO in Docker Compose for S3-compatible object storage
- NestJS backend run locally with `pnpm`
- React + Vite frontend run locally with `pnpm`
- Prisma 7 with PostgreSQL

The project uses PostgreSQL in Docker for local development. Supabase is not part of the local database setup. For daily development, only PostgreSQL should run in Docker. Backend and frontend should run directly on the host with `pnpm`.

### Docker Compose

`docker-compose.yaml` is validated for local development with:

- `postgres` service present
- `postgres:16`
- host/container port mapping `5433:5432`
- persistent volume `postgres_data:/var/lib/postgresql/data`
- `minio` service present
- MinIO API port `9000`
- MinIO console port `9001`
- persistent volume `minio_data:/data`

If you run the backend container, its internal database settings are:

`docker-compose.deploy.yml` is the separate deployment compose. It uses published Docker Hub images, does not build source code locally, routes browser API calls through `/api` with nginx proxying to `backend:3000`, and includes MinIO as the object storage service.

### Environment Variables

Create `backend/.env` locally from [backend/.env.example](/C:/Users/Tadeo/Desktop/ORT/4to/PF/Nestle/nestle-ai-newsletter/backend/.env.example). Do not commit `backend/.env`.

Required local database values:

Notes:

- `backend/.env` is ignored by Git through the root `.gitignore`.
- `backend/.env.example` must contain placeholders only, never real secrets.
- Binary content stays in MinIO, not PostgreSQL. PostgreSQL stores metadata such as bucket, object key, object prefix, and file name.

### Daily Development

For normal development:

```bash
docker compose up -d postgres minio minio-init
pnpm --dir backend dev
pnpm --dir frontend dev
```

Development URLs:

- PostgreSQL from the host: `localhost:5433`
- PostgreSQL from Docker services: `postgres:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Notes:

- You do not need to run backend or frontend in Docker during daily development.
- PostgreSQL and MinIO run in Docker.
- Backend and frontend run locally with `pnpm`.

If your backend package does not expose `dev`, use:

```bash
pnpm --dir backend run start:dev
```

### Local Database Validation From Scratch

1. Start PostgreSQL:

```bash
docker compose up -d postgres minio minio-init
```

2. Wait until PostgreSQL and MinIO are ready:

```bash
docker compose logs postgres
docker compose logs minio
docker compose logs minio-init
```

3. Load the schema:

```bash
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/init.sql
```

4. Load the foundational seed:

```bash
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/seed.sql
```

5. Seed catalog assets and fonts into MinIO + PostgreSQL:

```bash
docker compose --profile seed up assets-seed
```

6. Validate tables:

```bash
docker compose exec postgres psql -U lumen -d ai_newsletter_db
\dt
```

7. Validate local users:

```sql
SELECT email, role, state
FROM public.users
ORDER BY role;
```

Expected users:

- `admin@local.test` with role 
- `functional@local.test` with role 
- `user@local.test` with role 

8. Validate permissions per role:

```sql
SELECT role, COUNT(*) AS permissions_count
FROM public.role_permissions
GROUP BY role
ORDER BY role;
```

Expected result:

```txt
ADMIN      16
FUNCTIONAL 10
USER       5
```

9. Validate foundational catalogs:

```sql
SELECT name FROM public.font_groups ORDER BY name;
SELECT name FROM public.brand_kit ORDER BY name;
SELECT code FROM public.template_states ORDER BY code;
SELECT code FROM public.export_types ORDER BY code;
```

10. Validate Prisma:

```bash
pnpm --dir backend prisma validate
pnpm --dir backend prisma generate
```

If your local `pnpm` installation does not resolve the Prisma binary with that form, use:

```bash
pnpm --dir backend exec prisma validate
pnpm --dir backend exec prisma generate
```

11. Optional introspection check:

```bash
pnpm --dir backend prisma db pull
git diff backend/prisma/schema.prisma
```

If your local `pnpm` installation needs explicit binary execution, use:

```bash
pnpm --dir backend exec prisma db pull
git diff backend/prisma/schema.prisma
```

The expected diff should be empty or cosmetic only. Large structural changes usually mean `database/init.sql` is not aligned with `backend/prisma/schema.prisma`.

12. Validate MinIO buckets:

```bash
docker compose ps
```

Open:

- `http://localhost:9001`

Log in with:

- user `minioadmin`
- password `minioadmin123`

Confirm that these private buckets exist:

- `ai-newsletter-assets`
- `ai-newsletter-fonts`
- `ai-newsletter-exports`

### MinIO Buckets

MinIO API:

- `http://localhost:9000`

MinIO Console:

- `http://localhost:9001`

Buckets:

- `ai-newsletter-assets`
- `ai-newsletter-fonts`
- `ai-newsletter-exports`

Local commands:

```bash
docker compose up -d minio minio-init
docker compose logs minio-init
```

Notes:

- `minio-init` creates the buckets automatically.
- Buckets are private by default.
- `database/seed.sql` bootstraps relational catalog data such as `font_groups`, `brand_kit`, `template_states`, and `export_types`.
- `assets-seed` uploads the file catalog from `backend/assets` and reflects it into `assets` and `fonts`.
- No binary content is stored in PostgreSQL.

### PowerShell Alternative

If the `<` operator fails in Windows PowerShell, use:

```powershell
Get-Content .\database\init.sql -Raw | docker compose exec -T postgres psql -U lumen -d ai_newsletter_db
Get-Content .\database\seed.sql -Raw | docker compose exec -T postgres psql -U lumen -d ai_newsletter_db
```

### Prisma Notes

`backend/prisma/schema.prisma` is aligned with PostgreSQL and uses enums, not old catalog tables, for:

- `area_name`
- `asset_type`
- `block_content_type`
- `newsletter_format`
- `newsletter_language`
- `newsletter_state`
- `user_role`
- `user_state`

The schema should not reintroduce old catalog models such as:

- `user_roles`
- `user_states`
- `asset_types`
- `block_content_types`
- `languages`
- `newsletter_states`
- `newsletter_formats`

`users.role` and `users.state` use enums directly. `newsletters.state`, `newsletters.language`, and `newsletters.format` also use enums directly.

Prisma 7 runtime note:

- The backend uses the Prisma PostgreSQL adapter through [prisma.service.ts](/C:/Users/Tadeo/Desktop/ORT/4to/PF/Nestle/nestle-ai-newsletter/backend/src/prisma/prisma.service.ts).
- `PrismaService` accepts  first and falls back to .
- `backend/prisma.config.ts` uses the same fallback for Prisma CLI commands.

### Reset Local Database

Stop PostgreSQL without deleting data:

```bash
docker compose stop postgres
```

Stop containers without deleting data:

```bash
docker compose down
```

Delete the full local database volume:

```bash
docker compose down -v
```

After `docker compose down -v`, run:

```bash
docker compose up -d postgres
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/init.sql
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/seed.sql
```

### Security

Do not commit:

- `backend/.env`
- `frontend/.env`
- build output
- real credentials

If a secret is committed by accident:

1. Remove it from the branch before pushing.
2. Rotate the secret in the provider.
3. Verify `.gitignore` coverage.

### Docker Image Publishing

Docker Hub setup:

- Create the repositories `nestle-ai-newsletter-backend` and `nestle-ai-newsletter-frontend`.
- Create a Docker Hub Personal Access Token with `Read & Write` permissions.
- Save these GitHub Actions secrets in the repository:

Workflow behavior:

- On `push` to `main`, `staging`, or `docker`, GitHub Actions builds and publishes backend and frontend images.
- On `pull_request`, GitHub Actions validates install/build and Docker image build only. It does not push images.

Published image tags:

- `latest`
- `${{ github.sha }}`

Manual pull example:

```bash
docker pull <DOCKERHUB_USERNAME>/nestle-ai-newsletter-backend:latest
docker pull <DOCKERHUB_USERNAME>/nestle-ai-newsletter-frontend:latest
```

### Deployment With Docker Hub

Compose files:

- `docker-compose.yaml` is for local development.
- `docker-compose.deploy.yml` is for deployment.
- Deployment uses published images from Docker Hub. It does not build backend or frontend locally.
- The deployed frontend calls the backend through `/api`, and nginx proxies that traffic to `backend:3000`.
- MinIO replaces Supabase Storage and provides S3-compatible object storage for assets, images, fonts, and exports.

Deployment environment file:

1. Copy `.env.deploy.example` to `.env.deploy`.
2. Set .
3. Set .
4. Set  and .

 can be:

- `latest`
- a commit SHA tag
- a version such as `v1.0.0`

Deployment commands:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env pull
docker compose -f docker-compose.deploy.yml --env-file .env.deploy up -d
```

Check status:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy ps
```

MinIO ports:

- API `9000`
- Console `9001`

Deployment bucket validation:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy up -d minio minio-init
docker compose -f docker-compose.deploy.yml --env-file .env.deploy logs minio-init
```

View backend logs:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy logs backend
```

First database initialization if PostgreSQL is empty:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/init.sql
docker compose -f docker-compose.deploy.yml --env-file .env.deploy exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/seed.sql
docker compose -f docker-compose.deploy.yml --env-file .env.deploy --profile seed up assets-seed
```

The backend is not exposed publicly by default in deployment compose. Only the frontend port is published.
MinIO can be validated through `http://localhost:9001` or `http://SERVER:${MINIO_CONSOLE_PORT}` after deployment.

## Espanol

Aplicacion para crear y gestionar newsletters internos con frontend React, backend NestJS, Prisma 7 y base PostgreSQL local para desarrollo.

### Estructura Del Proyecto

```txt
.
|-- backend/                 # API NestJS
|   |-- prisma/              # Schema y config de Prisma
|   |-- src/
|   |   |-- prisma/          # PrismaModule y PrismaService
|   |   `-- ...
|   |-- Dockerfile
|   |-- package.json
|   `-- pnpm-lock.yaml
|-- frontend/                # App React + Vite + MUI
|-- database/
|   |-- init.sql             # Schema ejecutable local
|   `-- seed.sql             # Seeds minimos locales
|-- .github/workflows/
|-- docker-compose.yaml
|-- docker-compose.deploy.yml
|-- .env.deploy.example
|-- README_DEPLOY.md
`-- README.md
```

### Stack De Desarrollo Local

- PostgreSQL 16 en Docker Compose
- MinIO en Docker Compose como object storage compatible con S3
- Backend NestJS corriendo local con `pnpm`
- Frontend React + Vite corriendo local con `pnpm`
- Prisma 7 con PostgreSQL

El proyecto usa PostgreSQL en Docker para desarrollo local. Supabase no forma parte del setup local de base de datos. En el dia a dia se recomienda levantar solo PostgreSQL en Docker y correr backend/frontend en el host con `pnpm`.

### Docker Compose

`docker-compose.yaml` esta validado con:

- servicio `postgres`
- imagen `postgres:16`
- mapeo `5433:5432`
- volumen persistente `postgres_data:/var/lib/postgresql/data`
- servicio `minio`
- puerto API `9000`
- puerto consola `9001`
- volumen persistente `minio_data:/data`

Si se corre el backend dentro de Docker, usa:

`docker-compose.deploy.yml` es el compose separado de deployment. Usa imagenes publicadas en Docker Hub, no buildea el codigo fuente localmente, enruta las llamadas del navegador por `/api` con nginx apuntando a `backend:3000` e incluye MinIO como servicio de object storage.

### Variables De Entorno

Crear `backend/.env` a partir de [backend/.env.example](/C:/Users/Tadeo/Desktop/ORT/4to/PF/Nestle/nestle-ai-newsletter/backend/.env.example). No commitear `backend/.env`.

Valores locales requeridos:

Notas:

- `backend/.env` esta ignorado por Git desde el `.gitignore` root.
- `backend/.env.example` debe tener placeholders, nunca secretos reales.
- Los binarios quedan en MinIO, no en PostgreSQL. PostgreSQL guarda metadata como bucket, object key, object prefix y file name.

### Desarrollo Diario

Para desarrollar normalmente:

```bash
docker compose up -d postgres minio minio-init
pnpm --dir backend dev
pnpm --dir frontend dev
```

URLs:

- PostgreSQL desde el host: `localhost:5433`
- PostgreSQL desde Docker: `postgres:5432`
- MinIO API: `http://localhost:9000`
- Consola MinIO: `http://localhost:9001`
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Notas:

- No hace falta correr backend/frontend en Docker durante el desarrollo diario.
- PostgreSQL y MinIO corren en Docker.
- Backend y frontend corren con `pnpm`.

Si el backend no expone `dev`, usar:

```bash
pnpm --dir backend run start:dev
```

### Validacion Local Desde Cero

1. Levantar PostgreSQL:

```bash
docker compose up -d postgres minio minio-init
```

2. Esperar a que este listo:

```bash
docker compose logs postgres
docker compose logs minio
docker compose logs minio-init
```

3. Cargar schema:

```bash
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/init.sql
```

4. Cargar seed:

```bash
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/seed.sql
```

5. Validar tablas:

```bash
docker compose exec postgres psql -U lumen -d ai_newsletter_db
\dt
```

6. Validar usuarios:

```sql
SELECT email, role, state
FROM public.users
ORDER BY role;
```

Usuarios esperados:

- `admin@local.test` con role 
- `functional@local.test` con role 
- `user@local.test` con role 

7. Validar permisos por rol:

```sql
SELECT role, COUNT(*) AS permissions_count
FROM public.role_permissions
GROUP BY role
ORDER BY role;
```

Resultado esperado:

```txt
ADMIN      16
FUNCTIONAL 10
USER       5
```

8. Validar Prisma:

```bash
pnpm --dir backend prisma validate
pnpm --dir backend prisma generate
```

Si tu instalacion local de `pnpm` no resuelve el binario Prisma con esa forma, usar:

```bash
pnpm --dir backend exec prisma validate
pnpm --dir backend exec prisma generate
```

9. Introspection opcional:

```bash
pnpm --dir backend prisma db pull
git diff backend/prisma/schema.prisma
```

Si tu `pnpm` local necesita ejecucion explicita del binario, usar:

```bash
pnpm --dir backend exec prisma db pull
git diff backend/prisma/schema.prisma
```

El diff esperado deberia ser vacio o solo cosmetico. Si aparecen cambios estructurales grandes, `database/init.sql` no esta alineado con `backend/prisma/schema.prisma`.

10. Validar buckets de MinIO:

```bash
docker compose ps
```

Abrir:

- `http://localhost:9001`

Ingresar con:

- usuario `minioadmin`
- password `minioadmin123`

Verificar que existan estos buckets privados:

- `ai-newsletter-assets`
- `ai-newsletter-fonts`
- `ai-newsletter-exports`

### Buckets de MinIO

API de MinIO:

- `http://localhost:9000`

Consola de MinIO:

- `http://localhost:9001`

Buckets:

- `ai-newsletter-assets`
- `ai-newsletter-fonts`
- `ai-newsletter-exports`

Comandos locales:

```bash
docker compose up -d minio minio-init
docker compose logs minio-init
```

Notas:

- `minio-init` crea los buckets automaticamente.
- Los buckets son privados por defecto.
- La carga de assets, fonts y exports se implementara en una fase posterior.
- No se guardan binarios en PostgreSQL.

### Alternativa PowerShell

Si el operador `<` falla en Windows PowerShell, usar:

```powershell
Get-Content .\database\init.sql -Raw | docker compose exec -T postgres psql -U lumen -d ai_newsletter_db
Get-Content .\database\seed.sql -Raw | docker compose exec -T postgres psql -U lumen -d ai_newsletter_db
```

### Notas De Prisma

`backend/prisma/schema.prisma` esta alineado con PostgreSQL y usa enums, no tablas catalogo viejas, para:

- `area_name`
- `asset_type`
- `block_content_type`
- `newsletter_format`
- `newsletter_language`
- `newsletter_state`
- `user_role`
- `user_state`

No deberian existir modelos viejos como:

- `user_roles`
- `user_states`
- `asset_types`
- `block_content_types`
- `languages`
- `newsletter_states`
- `newsletter_formats`

`users.role` y `users.state` usan enums directos. `newsletters.state`, `newsletters.language` y `newsletters.format` tambien usan enums directos.

Nota de runtime Prisma 7:

- El backend usa el adapter PostgreSQL de Prisma en [prisma.service.ts](/C:/Users/Tadeo/Desktop/ORT/4to/PF/Nestle/nestle-ai-newsletter/backend/src/prisma/prisma.service.ts).
- `PrismaService` prioriza  y si no existe usa .
- `backend/prisma.config.ts` usa la misma logica para comandos CLI.

### Reset De La Base Local

Apagar PostgreSQL sin borrar datos:

```bash
docker compose stop postgres
```

Bajar contenedores sin borrar datos:

```bash
docker compose down
```

Borrar completamente la base local:

```bash
docker compose down -v
```

Despues de `docker compose down -v`, correr:

```bash
docker compose up -d postgres
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/init.sql
docker compose exec -T postgres psql -U lumen -d ai_newsletter_db < database/seed.sql
```

### Seguridad

No commitear:

- `backend/.env`
- `frontend/.env`
- builds
- credenciales reales

Si una secret se sube por error:

1. Quitarla de la rama antes de pushear.
2. Rotarla en el proveedor correspondiente.
3. Verificar que `.gitignore` la cubra.

### Publicacion De Imagenes Docker

Configuracion de Docker Hub:

- Crear los repositorios `nestle-ai-newsletter-backend` y `nestle-ai-newsletter-frontend`.
- Crear un Personal Access Token de Docker Hub con permisos `Read & Write`.
- Guardar estos secrets en GitHub Actions:

Comportamiento del workflow:

- En `push` a `main`, `staging` o `docker`, GitHub Actions construye y publica las imagenes de backend y frontend.
- En `pull_request`, GitHub Actions valida install/build y Docker build solamente. No publica imagenes.

Tags publicados:

- `latest`
- `${{ github.sha }}`

Prueba manual:

```bash
docker pull <DOCKERHUB_USERNAME>/nestle-ai-newsletter-backend:latest
docker pull <DOCKERHUB_USERNAME>/nestle-ai-newsletter-frontend:latest
```

### Deployment Con Docker Hub

Archivos compose:

- `docker-compose.yaml` es para desarrollo local.
- `docker-compose.deploy.yml` es para deployment.
- El deployment usa imagenes publicadas en Docker Hub. No hace build local de backend ni frontend.
- El frontend desplegado llama al backend por `/api`, y nginx hace proxy interno hacia `backend:3000`.
- MinIO reemplaza Supabase Storage y provee object storage compatible con S3 para assets, imagenes, fuentes y exports.

Archivo de entorno para deployment:

1. Copiar `.env.deploy.example` a `.env.deploy`.
2. Configurar .
3. Configurar .
4. Configurar  y .

 puede ser:

- `latest`
- un SHA de commit
- una version como `v1.0.0`

Comandos de deployment:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy pull
docker compose -f docker-compose.deploy.yml --env-file .env.deploy up -d
```

Ver estado:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy ps
```

Puertos MinIO:

- API `9000`
- Consola `9001`

Validacion de buckets en deployment:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy up -d minio minio-init
docker compose -f docker-compose.deploy.yml --env-file .env.deploy logs minio-init
```

Ver logs del backend:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy logs backend
```

Inicializacion de base la primera vez si PostgreSQL esta vacio:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.deploy exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/init.sql
docker compose -f docker-compose.deploy.yml --env-file .env.deploy exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < database/seed.sql
```

En deployment el backend no se expone publicamente por defecto. Solo se publica el puerto del frontend.
MinIO se puede validar en `http://localhost:9001` o `http://SERVIDOR:${MINIO_CONSOLE_PORT}` despues del deployment.
