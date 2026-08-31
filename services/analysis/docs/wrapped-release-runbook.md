# Wrapped Edition Release Runbook

## Preview

Generate a date-bounded preview for one edition. A preview must never update
`currentEdition` or overwrite a frozen artifact.

## Freeze

Freeze only a validated preview after a reviewer has confirmed coverage,
checksums, period bounds, and data version. Incomplete coverage blocks freeze.

## Publish

Publish only a frozen artifact. The publication change updates the edition index
in its own small commit so it can be reverted without deleting release data.

## Rollback

Restore the previous `currentEdition` in the editions index, validate it, and
deploy that index-only change. Never rewrite or delete a published artifact as
part of a rollback.
