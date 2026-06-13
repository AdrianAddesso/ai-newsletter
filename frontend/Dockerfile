FROM node:20 AS build

ARG PNPM_VERSION=10.33.2

WORKDIR /app/frontend

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY frontend ./
COPY packages/shared ../packages/shared

RUN pnpm run build

FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
