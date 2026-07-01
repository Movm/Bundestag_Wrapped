# Bundestag Wrapped — web app (React + Vite → static, served by nginx)
#
# Build context is THIS directory (apps/wrapped). Self-contained (no
# workspace-internal dependencies).
#
#   docker build -t bundestag-wrapped apps/wrapped
#
# Coolify: build pack = Dockerfile, "Base Directory" = /apps/wrapped

# ----- Build stage -----
FROM node:22-slim AS build
# Pin pnpm to match the repo (honors package.json pnpm.onlyBuiltDependencies)
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /app

# Vite build-time env (Umami analytics) — optional
ARG VITE_UMAMI_URL
ARG VITE_UMAMI_WEBSITE_ID
ENV VITE_UMAMI_URL=$VITE_UMAMI_URL
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# ----- Runtime stage (static files via nginx, non-root) -----
# nginx-unprivileged runs as uid 101 and cannot bind :80, so it listens on 8080
# (matched by nginx.conf). Coolify: set the app's internal port to 8080.
FROM nginxinc/nginx-unprivileged:alpine
# COPY runs as root at build time, so writing the html/conf dirs is fine.
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
# 127.0.0.1 (not localhost) avoids IPv6 resolution issues in Alpine
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
