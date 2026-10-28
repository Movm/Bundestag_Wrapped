# Wrapped Web Performance

The production build has a deterministic initial-payload budget: 1 MiB JavaScript
and 150 KiB CSS. Run `pnpm --filter bundestag-wrapped build` followed by
`pnpm --filter bundestag-wrapped check:bundle-budget`; CI runs both commands.

Large search datasets load only on the search route and only for the active search
tab. Edition assets use immutable `/data/<edition>/<dataVersion>/...` URLs. The
nginx image caches those assets for one year, while `editions.json` and each
edition manifest are revalidated so publish and rollback changes take effect.

The deployed nginx container listens on port 8080. Its Compose configuration and
health check use the same port. Brotli is provided by the hosting/CDN layer when
available; the image always enables gzip for JSON and static text assets.


## Interaction performance

Speech search fetches and validates the edition corpus inside a dedicated worker.
Only a page of 50 previews crosses to the UI; opening a result requests its full
text. The worker is terminated when leaving speech search or changing edition.
Search input commits to the router after a 300 ms pause. Results use bounded
pages instead of growing the DOM with every request.

Wrapped keeps all scroll-snap sections, but mounts contents only around the active
slide. Visited contents retain local state in React Activity; their effects are
suspended outside that window and while the document is hidden. The global
background also suspends when hidden. Previously visited DOM is retained, so this
is an effect/rendering optimization rather than a fixed upper bound on story DOM.

Run `pnpm --filter bundestag-wrapped audit:performance` against a production
preview. `PERF_URL`, `PERF_LABEL`, `PERF_OUTPUT`, `PERF_CPU`, `PERF_EDITION`, and
`PERF_CHANNEL` configure the run. Every run creates and prints a private, random
artifact subdirectory under `PERF_OUTPUT` (or the OS temporary directory). The default is mobile headless Chrome at 4x CPU
slowdown. Compare identical data and hardware without concurrent builds/tests.
The script reports rAF gaps and long tasks; it does not assert actual presented
frames or replace testing on physical Android/iOS devices.

See [the implementation and retest report](performance-2026-10-27.md).


## Reproducible measurement inputs

The Node Dockerfiles build from the monorepo root and install the committed
workspace lockfile with `--frozen-lockfile`. Docker uses isolated package linking;
the MCP runtime is assembled with pnpm deploy. The production dependency versions
are recorded after installation/deployment, not inferred from semver ranges.
Web builds publish `/build-info.json`; the MCP image contains `/app/build-info.json`.
Each records manifest/lockfile hashes, installed production versions, Node/pnpm
version and a dependency fingerprint. CI verifies provenance from both images.
Base image/OS updates are not claimed to be byte-for-byte image reproducibility.

The audit also records that fingerprint, browser/host, random seed (`PERF_SEED`),
frame p95/p99/max, gaps, Long Tasks and interaction-ready latency. It separates
worker startup/round-trip and corpus headers/body transfer, JSON parsing,
validation, engine setup and query execution. Worker timings are durations;
worker and page absolute clocks must not be subtracted. Measurement entries are
collected only in an explicitly instrumented audit session, without React state
updates per frame. Normal search results and error handling are unchanged.

`PERF_DOWNLOAD_MBPS` and `PERF_LATENCY_MS` request a network profile. Confirm the
worker's encoded bytes/body duration before interpreting it as an enforced limit.
`PERF_CHANNEL=chromium` uses bundled Chromium. `PERF_TRACE=1` exports a Chrome
Performance trace; treat that as a diagnostic run because recording adds overhead.
`actionMs` includes the scripted interaction (including typed-key delays/debounce)
and waits for results plus two animation frames; it is not pure query CPU time.
Compare cold navigation and warm queries separately, run at least three times,
and do not run builds/E2E concurrently with frame benchmarks.
