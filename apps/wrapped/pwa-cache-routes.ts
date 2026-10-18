/** Runtime-cache matchers for immutable, edition-versioned data assets. */
export const EDITION_ASSET_PATTERNS = {
  wrapped: /\/data\/(?!2026\/)[^/]+\/[^/]+\/wrapped\.json$/,
  speakers: /\/data\/(?!2026\/)[^/]+\/[^/]+\/speakers\/.*\.json$/,
  speeches: /\/data\/(?!2026\/)[^/]+\/[^/]+\/speeches.*\.json$/,
  rankings: /\/data\/(?!2026\/)[^/]+\/[^/]+\/(?:words|word_rankings|topic_rankings).*\.json$/,
} as const;
