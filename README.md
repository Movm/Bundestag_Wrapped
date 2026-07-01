# Bundestag Wrapped — Monorepo

One pnpm monorepo for the Bundestag project: the **MCP/API backend**, the **Python
NLP analysis** pipeline, and the **"Wrapped"** web + mobile frontend.

Combines three formerly-separate repos with full git history preserved
([`bundestag-mcp`](https://github.com/Movm/bundestag-mcp),
[`bundestag-analysis`](https://github.com/Movm/bundestag-analysis),
[`bundestag-wrapped`](https://github.com/Movm/bundestag-wrapped)).

| Package | Path | Stack | Role |
|---------|------|-------|------|
| **bundestag-mcp** | `services/mcp` | Node 22 / ESM | MCP server + HTTP API over the Bundestag DIP API. 33 MCP tools, semantic search (Qdrant + Mistral), NLP proxy. |
| **bundestag-analysis** | `services/analysis` | Python 3.12 (spaCy, FastAPI) | NLP library, NLP API + Wrapped API, CLI, JSON exports. *(not a pnpm member)* |
| **bundestag-wrapped** | `apps/wrapped` | React 19 + Vite 7 | "Spotify Wrapped" for parliament (web). |
| **bundestag-wrapped-mobile** | `apps/wrapped/mobile` | Expo / RN | Native app. |

## Architecture / data flow

```
                 DIP API (bundestag.de)
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
  services/analysis (Python)      services/mcp (Node)
  spaCy NLP + FastAPI             MCP server + HTTP API
  ├─ NLP API  :8000  ◄────────────  ANALYSIS_SERVICE_URL (proxied)
  ├─ Wrapped API :8001             + Qdrant + Mistral (semantic search)
  └─ exports static JSON                 │
        │                                ▼
        ▼                          MCP clients (Claude, Grünerator, …)
  apps/wrapped (web + mobile)
  consumes the static JSON
```

- **`services/mcp`** is the integration seam for **Grünerator**. A public instance is
  live at `https://bundestagapi.moritz-waechter.de/mcp`.
- **`services/analysis`** produces the JSON `apps/wrapped` renders and exposes the NLP
  endpoints `services/mcp` proxies.

## Getting started

### JS/TS workspace (mcp + wrapped web/mobile)

```bash
pnpm install                 # single lockfile for all JS/TS packages

pnpm dev:mcp                 # MCP server — needs DIP_API_KEY (services/mcp/.env.example)
pnpm dev:web                 # Wrapped web app
pnpm --filter bundestag-wrapped-mobile start   # Expo dev server

pnpm test                    # all workspace tests
pnpm lint                    # all workspace lint
pnpm build                   # build the web app
```

> **React versions are decoupled.** `apps/wrapped/mobile` (Expo) pins the exact React
> version its Expo SDK ships. Do **not** add `react`/`react-dom` to root
> `pnpm.overrides` — a global override breaks React Native. Root `.npmrc` uses
> `node-linker=hoisted` so Expo and the native `better-sqlite3` resolve correctly.

### Python service (`services/analysis`)

Not managed by pnpm. Requires Python 3.12.

```bash
cd services/analysis
pip install -e ".[dev]"
python -m spacy download de_core_news_lg    # ~570 MB, needed for NLP (not for tests)

pytest                                       # unit tests (no model needed)
bundestag-analysis --help
bundestag-analysis serve --port 8000         # NLP API
bundestag-analysis serve-wrapped --port 8001 # pre-computed Wrapped data
```

## MCP server (`services/mcp`) — highlights

- **33 tools** — search Drucksachen / Plenarprotokolle / Vorgänge / Personen /
  Aktivitäten, full-text retrieval, semantic + hybrid speech search, document-section
  search, and NLP analysis (tone, topics, party comparison).
- **8 prompts**, **12 resources**, dual stateful/stateless MCP transport.
- Production hardening: graceful shutdown, retry+backoff, token-bucket rate limiting,
  circuit breaker, three-layer caching, Prometheus metrics (`/metrics/prometheus`),
  deep health checks (`/health`, `/health/deep`).

Config via `services/mcp/.env.example` (a public DIP test key is provided).

## Testing

| Package | Command | Coverage |
|---------|---------|----------|
| mcp | `pnpm --filter bundestag-mcp test` | text normalization, token estimator, rate limiter (24 tests) |
| wrapped | `pnpm --filter bundestag-wrapped test` | share-canvas rendering (37 tests) |
| analysis | `cd services/analysis && pytest` | speech/Bundeskanzler parsing (7 tests) |

CI runs all of the above on every push/PR — see `.github/workflows/ci.yml`.

## Deployment (Docker / Coolify)

Every deployable ships a **self-contained Dockerfile** — each builds from its own
directory (no workspace-internal deps), which keeps the Coolify setup trivial: one
Application per row, build pack *Dockerfile*, just point the **Base Directory** at the
subfolder.

| App | Coolify Base Directory | Dockerfile | Port |
|-----|------------------------|------------|------|
| **wrapped** (website) | `/apps/wrapped` | `Dockerfile` | 80 |
| **mcp** (API) | `/services/mcp` | `Dockerfile` | 3000 |
| **analysis** (API) | `/services/analysis` | `Dockerfile.api` | 8000 |

Add env vars per service (see each `.env.example`), then deploy. `wrapped` is a static
site — no runtime env needed.

Local full-stack bring-up (qdrant + analysis + mcp + wrapped):

```bash
docker compose up --build
# wrapped → http://localhost:8080 · mcp → http://localhost:3000
```

Build a single image directly:

```bash
docker build -t bundestag-mcp      services/mcp
docker build -t bundestag-wrapped  apps/wrapped
docker build -f services/analysis/Dockerfile.api -t bundestag-analysis services/analysis
```

## Grünerator integration (north star)

Grünerator already consumes the deployed Bundestag MCP. This monorepo is the
maintainable home for that backend; integration options are pointing Grünerator's MCP
config at the hosted instance, or calling `services/mcp`'s HTTP API directly.

## License

MIT
