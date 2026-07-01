# CLAUDE.md — Bundestag Wrapped Monorepo

pnpm monorepo combining three formerly-separate repos (imported via `git subtree`,
history preserved). See `README.md` for the full architecture diagram.

## Layout

- **`apps/wrapped`** — React 19 + Vite 7 web app ("Wrapped for parliament").
  - **`apps/wrapped/mobile`** — Expo / React Native app, its **own** package.json.
- **`services/mcp`** — Node.js (ESM) MCP server + HTTP API over the Bundestag DIP
  API. Semantic search via Qdrant + Mistral; proxies NLP to `services/analysis`
  via `ANALYSIS_SERVICE_URL`. Public instance: `bundestagapi.moritz-waechter.de/mcp`.
  **This is the Grünerator integration seam.**
- **`services/analysis`** — Python (spaCy + FastAPI). NLP library, two FastAPI
  services (NLP API :8000, Wrapped API :8001), CLI. **NOT a pnpm workspace member.**
- **`packages/`** — shared TypeScript (empty for now).

## Conventions

- **Package manager: pnpm** (workspace). `pnpm install` from root. Python
  `services/analysis` is managed separately with pip/`pyproject.toml`.
- **React versions are decoupled between web and mobile.** `apps/wrapped/mobile`
  (Expo) pins the exact React version its Expo SDK ships; bump only via
  `npx expo install react react-dom` during an SDK upgrade. **Never** add
  `react`/`react-dom` to root `pnpm.overrides` — a global override forces mobile to
  the web version and breaks React Native.
- **Cross-service local dev:** `services/mcp/docker-compose.yaml` references
  `services/analysis` as a sibling (`context: ../analysis`).

## Data flow

`services/analysis` (Python) parses DIP protocols → runs spaCy NLP → exports static
JSON (consumed by `apps/wrapped`) and serves the NLP/Wrapped APIs (proxied by
`services/mcp`). `services/mcp` also does its own DIP search + Qdrant/Mistral
semantic search and exposes everything over MCP + HTTP to clients (Claude,
Grünerator).
