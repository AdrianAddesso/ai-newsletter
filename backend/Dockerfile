FROM node:20

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY packages/shared ./packages/shared
COPY backend ./backend

WORKDIR /app/backend

RUN pnpm install --frozen-lockfile

RUN pnpm run build

ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]