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
`PERF_CHANNEL` configure the run. The default is mobile headless Chrome at 4x CPU
slowdown. Compare identical data and hardware without concurrent builds/tests.
The script reports rAF gaps and long tasks; it does not assert actual presented
frames or replace testing on physical Android/iOS devices.

See [the implementation and retest report](performance-2026-10-27.md).
