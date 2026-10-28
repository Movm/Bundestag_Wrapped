# Bundestag MCP Server — container image (self-contained, multi-stage)
#
# Build context is the monorepo root; dependency versions come from pnpm-lock.yaml.
#   docker build -f services/mcp/Dockerfile .
# Coolify: Base Directory = /; Dockerfile Location = /services/mcp/Dockerfile

# ----- Build stage: has the C++ toolchain to compile better-sqlite3 -----
# Pinned to Node 22 LTS: Node >=25 ships an undici whose stricter argument
# validation makes @qdrant/js-client-rest throw UND_ERR_INVALID_ARG on every
# request (surfaces as "fetch failed"), disabling semantic search. See #45.
FROM node:22-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Pin pnpm to match the repo (honors package.json pnpm.onlyBuiltDependencies)
RUN npm install -g pnpm@10.0.0

WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY services/mcp/package.json services/mcp/package.json
RUN pnpm install --prod --frozen-lockfile --filter bundestag-mcp --config.node-linker=isolated
COPY services/mcp/src services/mcp/src
COPY scripts/write-build-info.mjs scripts/write-build-info.mjs
ARG SOURCE_COMMIT
RUN pnpm --filter bundestag-mcp deploy --prod /opt/production
RUN SOURCE_COMMIT=$SOURCE_COMMIT node scripts/write-build-info.mjs services/mcp /opt/production/build-info.json /opt/production

# ----- Runtime stage: clean base, no compilers/pnpm — just node + the app -----
FROM node:22-slim AS runtime
# curl only, for the healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.title="Bundestag MCP Server"
LABEL org.opencontainers.image.description="MCP Server for German Bundestag parliamentary documentation (DIP API)"
LABEL org.opencontainers.image.source="https://github.com/Movm/bundestag"
LABEL org.opencontainers.image.licenses="MIT"
LABEL mcp.discoverable="true"
LABEL mcp.transport="streamable-http"
LABEL mcp.endpoint="/mcp"

WORKDIR /app
ENV NODE_ENV=production
# Copy the already-built dependency tree + source, owned by the unprivileged
# "node" user (uid 1000) that ships with node:22-slim.
COPY --from=build --chown=node:node /opt/production/ ./
# Writable SQLite cache dir owned by the runtime user
RUN mkdir -p /app/data && chown -R node:node /app/data

# Drop root for the running process
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]
