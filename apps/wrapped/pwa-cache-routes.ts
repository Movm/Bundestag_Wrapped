/** Runtime-cache matchers for immutable, edition-versioned data assets. */
export const EDITION_ASSET_PATTERNS = {
  searchIndex: /\/data\/(?!2026\/)[^/]+\/search-v[0-9]+-[a-f0-9]{64}-[a-f0-9]{64}\/(?:index\.json|grams\/[a-f0-9]{4,12}\.bin|details\/[0-9]+\.json)$/,
  wrapped: /\/data\/(?!2026\/)[^/]+\/[^/]+\/wrapped\.json$/,
  speakers: /\/data\/(?!2026\/)[^/]+\/[^/]+\/speakers\/.*\.json$/,
  speeches: /\/data\/(?!2026\/)[^/]+\/[^/]+\/speeches.*\.json$/,
  rankings: /\/data\/(?!2026\/)[^/]+\/[^/]+\/(?:words|word_rankings|topic_rankings).*\.json$/,
} as const;
