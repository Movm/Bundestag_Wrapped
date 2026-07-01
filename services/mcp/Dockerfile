# Bundestag MCP Server — container image (self-contained, multi-stage)
#
# Build context is THIS directory (services/mcp). The package has no
# workspace-internal dependencies, so it builds standalone.
#
#   docker build -t bundestag-mcp services/mcp
#
# Coolify: build pack = Dockerfile, "Base Directory" = /services/mcp

# ----- Build stage: has the C++ toolchain to compile better-sqlite3 -----
FROM node:22-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Pin pnpm to match the repo (honors package.json pnpm.onlyBuiltDependencies)
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app
# Install prod deps (better-sqlite3 native build approved via package.json pnpm config)
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile
COPY src/ ./src/

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
# Copy the already-built dependency tree + source from the build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src ./src
RUN mkdir -p /app/data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]
