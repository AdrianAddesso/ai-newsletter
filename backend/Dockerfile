FROM node:20

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY backend/package.json backend/pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY backend .

RUN pnpm run build

ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]