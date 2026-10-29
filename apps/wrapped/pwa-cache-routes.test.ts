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

it('caches version-bound public search resources without caching range bodies or private previews', () => {
  const base = `/data/2025/search-v1-${'a'.repeat(64)}-${'b'.repeat(64)}`;
  const pattern = EDITION_ASSET_PATTERNS.searchIndex;
  for (const asset of ['index.json', 'grams/006100620063.bin', 'details/12.json']) {
    expect(pattern.test(`${base}/${asset}`)).toBe(true);
    expect(pattern.test(`${base.replace('/2025/', '/2026/')}/${asset}`)).toBe(false);
  }
  expect(pattern.test(`${base}/texts.bin`)).toBe(false);
  expect(pattern.test('/data/2025/search-v1/index.json')).toBe(false);
});
