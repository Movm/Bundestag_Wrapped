# Bundestag MCP Server — container image (self-contained)
#
# Build context is THIS directory (services/mcp). The package has no
# workspace-internal dependencies, so it builds standalone.
#
#   docker build -t bundestag-mcp services/mcp
#
# Coolify: build pack = Dockerfile, "Base Directory" = /services/mcp

FROM node:22-slim
# curl for the healthcheck; build toolchain for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Pin pnpm to match the repo (honors package.json pnpm.onlyBuiltDependencies)
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

LABEL org.opencontainers.image.title="Bundestag MCP Server"
LABEL org.opencontainers.image.description="MCP Server for German Bundestag parliamentary documentation (DIP API)"
LABEL org.opencontainers.image.source="https://github.com/Movm/bundestag"
LABEL org.opencontainers.image.licenses="MIT"
LABEL mcp.discoverable="true"
LABEL mcp.transport="streamable-http"
LABEL mcp.endpoint="/mcp"

WORKDIR /app

# Install prod deps (better-sqlite3 native build approved via package.json pnpm config)
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

# App source
COPY src/ ./src/
RUN mkdir -p /app/data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]
