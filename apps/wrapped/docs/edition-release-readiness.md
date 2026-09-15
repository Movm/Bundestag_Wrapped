# Reproducible edition release readiness

The edition workflow treats a preview, freeze, and publish as distinct operations.
Preview jobs upload an artifact only. They never write the public data directory or
the editions registry. A freeze creates a reviewed data PR; publishing later creates
a separate, index-only PR and remains subject to the Berlin launch-date gate.

`generate-edition` writes `release-report.json` into every artifact. The report pins
the requested period, Wahlperioden, selected and downloaded protocol IDs, source
coverage problems, the data version, the reviewed quiz configuration, active question
IDs, configured omissions, and a deterministic input fingerprint. The report itself
is protected by the artifact checksum map.

Freezing and publishing fail closed unless the report proves all selected protocols
were downloaded and parsed, no download failed, no source-coverage problem remains,
and the original selection exactly matches the edition period. This prevents
`coverage.complete` from becoming true merely because `--freeze` was supplied.

For a reviewed quiz configuration, pass its repository-relative path as `quizConfig`
when manually dispatching the workflow. The configuration is copied into
`content.json`; its checksum and the release-report fingerprint make later changes
visible. Do not supply final 2026 wording until the November content review.

Before the actual launch, run the workflow against a test edition and verify:
preview artifact → frozen-data PR → date-allowed index-only PR → registry rollback.
The test must use a disposable data root; it must not alter `apps/wrapped/public/data/editions.json`.
After deployment, smoke-test `/`, `/2025`, `/2026`, and the chosen data version.
