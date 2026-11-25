# CLAUDE.md — Bundestag Wrapped Monorepo

pnpm monorepo combining three formerly-separate repos (imported via `git subtree`,
history preserved). See `README.md` for the full architecture diagram.

## Layout

- **`apps/wrapped`** — React 19 + Vite 7 Web/PWA app ("Wrapped for parliament").
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
- **Cross-service local dev:** `services/mcp/docker-compose.yaml` references
  `services/analysis` as a sibling (`context: ../analysis`).

## Data flow

`services/analysis` (Python) parses DIP protocols → runs spaCy NLP → exports static
JSON (consumed by `apps/wrapped`) and serves the NLP/Wrapped APIs (proxied by
`services/mcp`). `services/mcp` also does its own DIP search + Qdrant/Mistral
semantic search and exposes everything over MCP + HTTP to clients (Claude,
Grünerator).

## apps/wrapped-app (Expo DOM shell)

- **Web code travels with the app, data does not.** Code changes reach the app via store release or EAS Update; data (`/data`, `/sounds`, images) always comes live from the server. A **data format** change must stay compatible with shipped app versions, as it already must with cached browser tabs. Server changes the app needs (CORS) go live before the first app build.
- **The protocol is frozen once a binary is in the store.** Shipped apps keep speaking their protocol version. New messages are additive only; none is renamed or removed. Both sides ignore unknown messages. `window.__WRAPPED_NATIVE__.protocol` is `1`; the web app only checks the number once a `2` exists.
- **React is decoupled.** `apps/wrapped-app` pins `react`/`react-dom` exactly to the Expo SDK version (SDK 58: `19.3.0`) and only bumps via `npx expo install react react-dom`. Never put `react`/`react-dom` in the root `pnpm.overrides` (breaks React Native). The web app keeps `^19.3.1`.
- **Dependencies only via `npx expo install`** so the SDK 58 versions match.
- **Shared code lives in the web package** under `apps/wrapped/src/shared/`: plain TypeScript, no `import.meta`, no DOM, no Vite. The app imports it by relative path. `apps/wrapped/src/shared/theme-music/index.ts` must **not** be imported natively; only `types.ts` and `bridge.ts`.
- **`EXPO_NO_BUNDLE_SPLITTING=1` is mandatory** for every export/build (Expo bug H2): in the `package.json` scripts and in `eas.json` (`build.*.env`).
- **No search, no Web Workers in the app** (they need bundle splitting).
- **Every web change must also pass `pnpm --filter wrapped-app export:check`** (CI runs it).
