# Wrapped Edition Release Runbook

## Preview

Generate a date-bounded preview for one edition. A preview must never update
`currentEdition` or overwrite a frozen artifact.

Scheduled builds prepare **2026 artifacts only**. An omitted preview end date
resolves to the current UTC date, capped at December 31 of the edition year.
Manual previews may specify an earlier cutoff; future cutoffs are rejected.
The cutoff is resolved before downloading the analysis dependencies and model.

Preview output lives under `$RUNNER_TEMP/wrapped-preview`, outside the website,
and is uploaded as a GitHub Actions artifact for 14 days. Download it from the
successful **Build Wrapped edition** run to inspect the manifest, coverage,
checksums, and quiz output. A successful preview does not deploy anything or
refresh the preview registered on the live site.

Keep `currentEdition` set to **2025** until the 2026 launch is explicitly approved.
Do not regenerate the published `data/2025/final` artifacts or legacy 2025 quiz
JSON while preparing 2026. Do not switch the homepage as part of a preview fix.

## Freeze

Freeze only a validated preview after a reviewer has confirmed coverage,
checksums, period bounds, and data version. Incomplete coverage blocks freeze.
Freeze and publish runs require an explicit `to` date; there is no automatic
cutoff for either release operation.

## Publish

Publish only a frozen artifact. The publication change updates the edition index
in its own small commit so it can be reverted without deleting release data.

## Rollback

Restore the previous `currentEdition` in the editions index, validate it, and
deploy that index-only change. Never rewrite or delete a published artifact as
part of a rollback.
