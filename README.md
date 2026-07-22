# AI Newsletter

Generic AI-assisted internal newsletter platform for creating, reviewing, and exporting branded internal communications.

## Overview

- React + Vite frontend for newsletter authoring and back-office flows.
- NestJS backend for authentication, newsletter workflows, assets, and AI integration.
- Shared TypeScript package for cross-app types.
- PostgreSQL/Prisma persistence and export-oriented newsletter rendering.

## Repository Structure

- `frontend/`: React application.
- `backend/`: NestJS API.
- `packages/shared/`: shared TypeScript configuration and types.
- `database/`: seed and database-related files.
- `scripts/`: helper scripts for local workflows and document generation.

## Requirements

- Node.js 20+
- `pnpm`
- PostgreSQL

## Getting Started

Install dependencies in each app:

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

Run the applications locally:

```bash
cd backend
pnpm start:dev

cd ../frontend
pnpm dev
```

Build the applications:

```bash
cd backend
pnpm build

cd ../frontend
pnpm build
```

## Notes

- Environment variables are expected to be provided locally and are not committed.
- Asset seeding is intentionally disabled in this sanitized case-study version.
- Generated output artifacts under `output/pdf/` are ignored.
