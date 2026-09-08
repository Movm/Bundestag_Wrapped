import { describe, expect, it } from 'vitest';

import { EDITION_ASSET_PATTERNS } from './pwa-cache-routes';

describe('edition PWA runtime-cache routes', () => {
  it.each([
    ['wrapped', '/data/2025/final/wrapped.json', '/data/2026/preview-1/wrapped.json'],
    ['speakers', '/data/2025/final/speakers/ada.json', '/data/2026/preview-1/speakers/ada.json'],
    ['speeches', '/data/2025/final/speeches.json', '/data/2026/preview-1/speeches.json'],
    ['rankings', '/data/2025/final/word_rankings.json', '/data/2026/preview-1/word_rankings.json'],
  ] as const)('requires edition and dataVersion for %s assets', (kind, first, second) => {
    const pattern = EDITION_ASSET_PATTERNS[kind];
    expect(pattern.test(first)).toBe(true);
    expect(pattern.test(second)).toBe(true);
    expect(first).not.toBe(second);
    expect(pattern.test(first.replace('/2025/final', ''))).toBe(false);
  });
});
