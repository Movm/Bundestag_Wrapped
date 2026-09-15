# Publishing a Wrapped edition

Only editions with `status: "published"` belong in the production registry and
the production data directory. Previews are GitHub Actions artifacts, not static
website assets. This prevents direct URLs, PWA precaches, navigation, and the
sitemap from exposing an unreleased edition.

For 2026, `publish_in_index` rejects any attempt before **1 December 2026,
Europe/Berlin**. The gate uses the release runner's time in the Berlin timezone
and is tested immediately before and at the permitted calendar day. It does not
schedule, publish, or change `currentEdition` automatically: a maintainer must
explicitly run the `publish` workflow and merge the resulting index-only PR.

If an earlier build served preview assets, clients that already downloaded them
cannot be recalled. New production builds exclude them; deploy the new build and
let the existing service-worker revision replace its prior precache. `/2025`
remains a published, directly addressable edition and the index-only PR remains
the reversible switch for a later rollback.
