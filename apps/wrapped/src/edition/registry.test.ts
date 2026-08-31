import { describe, expect, it } from 'vitest';

import { isEditionId, resolveAssetUrl } from './registry';

describe('edition routing helpers', () => {
  it('does not treat reserved static routes as editions', () => {
    expect(isEditionId('dokumentation')).toBe(false);
    expect(isEditionId('2026')).toBe(true);
  });

  it('resolves assets relative to the versioned manifest', () => {
    expect(resolveAssetUrl('/data/2026/preview/manifest.json', 'speakers/index.json')).toBe('/data/2026/preview/speakers/index.json');
  });
});
