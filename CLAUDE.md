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

### Releasing the app

- **One path: `apps/wrapped-app/.eas/workflows/release.yml`.** It builds iOS and Android with the `production` profile and hands both to the stores. Input `track`: `closed` (default, also for tags) = Play `alpha` + TestFlight external group (`testflight_group`, default `Beta`, starts Beta App Review); `internal` = Play internal + TestFlight internal testers; `open` = Play `beta` + TestFlight external. The tracks are the submit profiles `production`, `internal`, `open-testing` in `eas.json`. The public store release stays a manual click in the consoles. `preview-android.yml` builds an installable APK without the stores. Android production builds run on the `large` worker (paid EAS plan) and only build the two ARM ABIs the stores need. Start it with a tag `app-v<version>`, with "Run" on expo.dev, or with `npx eas-cli@latest workflow:run .eas/workflows/release.yml` from `apps/wrapped-app`. The expo.dev project is linked to this repo with base directory `apps/wrapped-app`.
- **Versions.** Bump `expo.version` in `app.json` before tagging (1.1.0 was the first Expo DOM release; Play already had 1.0.0). Build numbers are remote (`appVersionSource: remote`, `autoIncrement`); `ios.buildNumber` / `android.versionCode` in `app.json` were only the starting values and are ignored now.
- **Before tagging**, in `apps/wrapped-app`: `npx expo-doctor@latest`, `npx expo install --check`, `pnpm test`, `npx tsc --noEmit`, `pnpm export:check`, and make sure the export contains no `127.0.0.1` (the local device-test override must never be committed).
- **`.easignore` replaces every `.gitignore` for EAS uploads.** It re-includes `apps/wrapped/src/data/` (the root rule `data/` would drop it: the 1.1.0 builds failed with `Unable to resolve "@/data/wrapped-contract"`) and leaves out what the app fetches from the site at runtime. When you add a `.gitignore` rule, add it there too. When the app starts to `require()` a new file from `apps/wrapped/public/`, re-include it (today: `cover-adler.webp`, `sounds/start.wav`).
- **Native config lives in `app.json`; `ios/` and `android/` are generated and ignored.** After changing native config, local simulator builds need `npx expo prebuild --clean`, otherwise they keep the old `Info.plist` (e.g. `supportsTablet`).
- **Credentials live on EAS.** The Android keystore is the Play upload key of the live app: never regenerate it. The iOS distribution certificate is shared with the Grünerator app (expires 2027-04-24). An expired provisioning profile can only be renewed interactively once (`npx eas-cli@latest build -p ios --profile production`, Apple login); non-interactive builds fail until then.
- **No OTA updates.** `runtimeVersion` uses the `fingerprint` policy, but `expo-updates` is not installed; every code change ships as a store build.
- **Server first.** The deployed `nginx.conf` must serve CORS for `/data/`, `/sounds/`, fonts and `/logo.png`, and accept the preview code as header `X-Gartenzaun` on `/data/2026/`. Testers unlock an unpublished edition with `bundestag-wrapped://zugang?code=<code>`.
- **Store listing.** App Store Connect app `6757131770`, Play package `de.bundestag.wrapped`. The app runs natively on iPad (`supportsTablet`, full screen, portrait), so iPad 13" screenshots are required. Store screenshots show no real MPs (no names, photos or rankings of politicians).
