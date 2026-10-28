# Bundestag Wrapped — web app (React + Vite → static, served by nginx)
#
# Build context is the monorepo root so CI and production use the same lockfile.
#   docker build -f apps/wrapped/Dockerfile .
# Coolify: Base Directory = /; Dockerfile Location = /apps/wrapped/Dockerfile

# ----- Build stage -----
FROM node:26-slim AS build
# Pin pnpm to match the repo (honors package.json pnpm.onlyBuiltDependencies)
# Node >=25 no longer bundles corepack — install pnpm directly via npm
RUN npm install -g pnpm@10.0.0
WORKDIR /workspace

# Vite build-time env (Umami analytics) — optional
ARG VITE_UMAMI_URL
ARG VITE_UMAMI_WEBSITE_ID
ENV VITE_UMAMI_URL=$VITE_UMAMI_URL
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/wrapped/package.json apps/wrapped/package.json
RUN pnpm install --frozen-lockfile --filter bundestag-wrapped --config.node-linker=isolated

COPY scripts/write-build-info.mjs scripts/write-build-info.mjs
COPY apps/wrapped apps/wrapped
ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT
RUN pnpm --filter bundestag-wrapped build

# ----- Runtime stage (static files via nginx, non-root) -----
# nginx-unprivileged runs as uid 101 and cannot bind :80, so it listens on 8080
# (matched by nginx.conf). Coolify: set the app's internal port to 8080.
FROM nginxinc/nginx-unprivileged:alpine
USER root
RUN apk add --no-cache apache2-utils
# COPY runs as root at build time, so writing the html/conf dirs is fine.
COPY --from=build /workspace/apps/wrapped/dist /usr/share/nginx/html
COPY apps/wrapped/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 apps/wrapped/docker-entrypoint.d/40-preview-auth.sh /docker-entrypoint.d/40-preview-auth.sh
USER 101
EXPOSE 8080
# 127.0.0.1 (not localhost) avoids IPv6 resolution issues in Alpine
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
