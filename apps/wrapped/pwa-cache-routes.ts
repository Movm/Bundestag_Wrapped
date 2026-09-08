/** Runtime-cache matchers for immutable, edition-versioned data assets. */
export const EDITION_ASSET_PATTERNS = {
  wrapped: /\/data\/[^/]+\/[^/]+\/wrapped\.json$/,
  speakers: /\/data\/[^/]+\/[^/]+\/speakers\/.*\.json$/,
  speeches: /\/data\/[^/]+\/[^/]+\/speeches.*\.json$/,
  rankings: /\/data\/[^/]+\/[^/]+\/(?:words|word_rankings|topic_rankings).*\.json$/,
} as const;
