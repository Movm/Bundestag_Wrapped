# Bundestag Wrapped — Monorepo

One pnpm monorepo for the Bundestag project: the MCP/API backend, the Python NLP
analysis pipeline, and the "Wrapped" web + mobile frontend.

Combines three formerly-separate repos
([`bundestag-mcp`](https://github.com/Movm/bundestag-mcp),
[`bundestag-analysis`](https://github.com/Movm/bundestag-analysis),
[`bundestag-wrapped`](https://github.com/Movm/bundestag-wrapped)) with their git
history preserved (imported via `git subtree`).

## Layout

```
apps/
  wrapped/          React 19 + Vite 7 web app — "Spotify Wrapped" for parliament
    mobile/         Expo / React Native app (own package.json)
services/
  mcp/              Node.js MCP server + HTTP API over the Bundestag DIP API
  analysis/         Python (spaCy + FastAPI) NLP library, services & CLI
packages/           Shared TypeScript (empty for now)
```

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

- **`services/mcp`** is the integration seam for Grünerator. A public instance is
  live at `https://bundestagapi.moritz-waechter.de/mcp`.
- **`services/analysis`** produces the JSON that `apps/wrapped` renders and exposes
  the NLP endpoints `services/mcp` proxies.

## Getting started

### JS/TS workspace (mcp + wrapped web/mobile)

```bash
pnpm install                 # single lockfile for all JS/TS packages

pnpm dev:mcp                 # run the MCP server (needs DIP_API_KEY — see services/mcp/.env.example)
pnpm dev:web                 # run the Wrapped web app
pnpm --filter bundestag-wrapped-mobile start   # Expo dev server

pnpm test                    # all workspace tests
pnpm build                   # build mcp + web
```

> **React versions are decoupled.** `apps/wrapped/mobile` (Expo) pins the exact
> React version its Expo SDK ships. Do **not** add `react`/`react-dom` to root
> `pnpm.overrides` — a global override breaks React Native.

### Python service (`services/analysis`)

Not managed by pnpm.

```bash
cd services/analysis
pip install -e ".[dev]"
python -m spacy download de_core_news_lg

pytest
bundestag-analysis --help
bundestag-analysis serve --port 8000            # NLP API
bundestag-analysis serve-wrapped --port 8001    # pre-computed Wrapped data
```

## Grünerator integration (north star)

Grünerator already consumes the deployed Bundestag MCP. This monorepo is the
maintainable home for that backend; integration options are pointing Grünerator's
MCP config at the hosted instance, or calling `services/mcp`'s HTTP API directly.

## CI note

Each imported project's original workflows live under its subdirectory
(`services/mcp/.github/`, etc.) and are **inert** — GitHub only runs workflows in
the repo-root `.github/workflows/`. Root CI is not yet wired.
