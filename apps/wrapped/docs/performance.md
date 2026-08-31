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
