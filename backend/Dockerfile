FROM node:20

ARG PNPM_VERSION=10.33.2

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

COPY backend/package.json backend/pnpm-lock.yaml ./backend/

WORKDIR /app/backend

RUN pnpm install --frozen-lockfile

WORKDIR /app

COPY packages/shared ./packages/shared
COPY backend ./backend

WORKDIR /app/backend

RUN pnpm run build

ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
