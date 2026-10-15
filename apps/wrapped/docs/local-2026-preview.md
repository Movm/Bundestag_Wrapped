# Local Bundestag Wrapped 2026 preview

The 2026 edition is intentionally not part of the production registry or the
deployable `public/data` tree. Local preview artifacts live in the ignored
`apps/wrapped/.dev-editions` directory and are exposed only by the Vite
development server.

## One-time setup

Install the JavaScript workspace and the Python analysis package with its spaCy
model as described in the repository README. The helper uses
`services/analysis/.venv/bin/bundestag-analysis` when it exists, or the
`bundestag-analysis` command on `PATH`. Set `BUNDESTAG_ANALYSIS_BIN` to override
that executable.

## Generate and open the preview

From the repository root:

```bash
pnpm preview:2026
pnpm dev:web
```

Open `http://localhost:5173/2026`. The command selects WP21 protocols from
January 1 through October 12, 2026, generates the validated edition
`preview-2026-10-12-context-v4`, and records the actual first and last available
protocol dates in its manifest. Re-running the command resumes the matching
download and replaces only this ignored local preview.

For another cutoff or future edition, invoke the generic helper directly:

```bash
node apps/wrapped/scripts/prepare-dev-edition.mjs \
  --edition 2027 --from 2027-01-01 --to 2027-10-12 \
  --version preview-2027-10-12 --wahlperiode 21
```

The 2026 preparation step creates a local 2025 baseline for the same calendar
period (January 1 through October 12, using WP20 and WP21) and stores the result
in the optional `yearOverYear` block of `wrapped.json`. It contains topic and
word rank movements plus youth-language counts. The comparison records the
exact baseline edition and period, so future editions do not silently change
the meaning of a delta.

The edition-specific quiz order lives in `config/2026/quiz.json`. It replaces
the Moin, speech-volume and interruption questions with topic riser, word riser
and youth-language questions. The editable lexicon is
`config/2026/youth-words.json`. It contains all 42 distinct Langenscheidt Top-10
candidates from 2022 through 2026, aliases, nomination years, four established
supplementary terms and context rules for ambiguous words. A complete duplicate
protocol payload is ignored during parsing and comparison. Changing these rules
requires a new data version and a regenerated preview. The frozen 2025 edition
remains unchanged.

Signature-word filters are defined globally in `config/signature-words.json`
and can be extended per edition in `config/2026/signature-words.json`.
Multi-word terms are excluded because the NLP output can contain merged person
entities; single-token person names or new political filler words can be added
to the edition-specific list without changing the frozen 2025 edition.

The catalog also marks `ragebait` as the 2026 winner. It remains visible as the
current Jugendwort even when the context-checked Bundestag count is zero.
