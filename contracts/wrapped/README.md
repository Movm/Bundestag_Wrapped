# Wrapped data contract

`v1.schema.json` is the canonical, versioned contract between the Python analysis
pipeline and the Wrapped web app. It defines the editions index, edition manifests,
and the current `wrapped.json` payload.

## Versioning

- A backwards-compatible addition uses the current schema version only when the
  new field is optional or belongs to an explicitly open analysis map.
- Removing, renaming, narrowing, or changing the meaning of an existing field
  requires a new schema version and a new generated TypeScript file.
- Published edition data is immutable. A correction is released with a new
  `dataVersion`, not by silently changing an existing release.

## Generated types

Run `pnpm contract:generate` after editing the schema. `pnpm contract:check`
fails when `apps/wrapped/src/generated/wrapped-contract-v1.ts` is stale; CI runs
this check before the web build.

Both the browser and Python validate JSON against this schema at runtime. The
closed objects reject undeclared fields; the few maps marked with
`additionalProperties` are intentionally extensible analysis data.
