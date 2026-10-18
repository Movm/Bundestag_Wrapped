import { describe, expect, it } from 'vitest';

import { EDITION_ASSET_PATTERNS } from './pwa-cache-routes';

describe('edition PWA runtime-cache routes', () => {
  it.each([
    ['wrapped', '/data/2025/final/wrapped.json', '/data/2024/final/wrapped.json'],
    ['speakers', '/data/2025/final/speakers/ada.json', '/data/2024/final/speakers/ada.json'],
    ['speeches', '/data/2025/final/speeches.json', '/data/2024/final/speeches.json'],
    ['rankings', '/data/2025/final/word_rankings.json', '/data/2024/final/word_rankings.json'],
  ] as const)('requires edition and dataVersion for %s assets and excludes protected previews', (kind, first, second) => {
    const pattern = EDITION_ASSET_PATTERNS[kind];
    expect(pattern.test(first)).toBe(true);
    expect(pattern.test(second)).toBe(true);
    expect(first).not.toBe(second);
    expect(pattern.test(first.replace('/2025/final', ''))).toBe(false);
    expect(pattern.test(first.replace('/2025/final', '/2026/preview-1'))).toBe(false);
  });
});
