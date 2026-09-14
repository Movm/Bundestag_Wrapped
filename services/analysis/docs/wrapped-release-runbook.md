# Wrapped Edition Release Runbook

## 2026 launch target

The planned public launch is **December 1, 2026 (Europe/Berlin)**. Keep 2025 as
the homepage until that release. Launch date and data cutoff are separate: a
November cutoff is valid for this launch and must be stated in the edition
manifest. Do not label it as a complete January–December dataset. Final cutoff
selection and source coverage still require review before freezing.

There is currently no time-based publication gate or scheduled homepage switch.
The manual publish workflow proposes the index PR; merging and deploying that
change makes the new homepage live. Do not merge that publication PR early.
Registered preview routes are publicly reachable even when they are not current;
`status: preview` is not access control. New working previews should remain
Actions artifacts or be served in a separate staging deployment.

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
The candidate must be frozen, but its registered predecessor may be a validated
preview. Coverage regression is rejected in either case. Freezing does not
change the edition registry or homepage.

## Quiz flexibility assessment

The current runtime supports automatic omission when metrics cannot produce an
answerable question. It removes the whole quiz story group and derives question
counts, scoring, navigation, and restored progress from the resulting slide
plan. Data and saved answers are scoped by edition and data version.

Editorial control is not implemented yet:

- `EditionContent` currently accepts only `editionId` and `year`; it has no
  ordered quiz list, enable/hide setting, question overrides, or launch date.
- `components/main-wrapped/slide-plan.ts` defines one shared story template.
  `domain/edition-quiz.ts` constructs the questions in code, and `SlideRenderer`
  dispatches a fixed set of quiz/slide IDs. Adding JSON quiz questions alone does
  not add them to the main journey.
- Both 2025 and 2026 use these shared builders. Frozen JSON protects the data,
  but changing shared question wording or slide composition can still change
  the 2025 experience.

Before editing the 2026 quiz selection, add a versioned, per-edition content
configuration for ordered/enabled quiz groups and supported question overrides.
Preserve the current behavior when this configuration is absent, so the frozen
2025 edition stays unchanged. New interaction types still need renderer code.
Verify that hiding/reordering/adding a supported 2026 quiz updates its count,
score and navigation while leaving the complete 2025 questions and slide plan
unchanged. Add release-date enforcement separately before relying on an
automatic December 1 launch.

## Publish

Publish only a frozen artifact. The publication change updates the edition index
in its own small commit so it can be reverted without deleting release data.

## Rollback

Restore the previous `currentEdition` in the editions index, validate it, and
deploy that index-only change. Never rewrite or delete a published artifact as
part of a rollback.
