import { describe, expect, it } from 'vitest';
import { getPartyTone, PARTY_COLORS } from './party-colors';

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('party tones', () => {
  for (const party of Object.keys(PARTY_COLORS)) {
    it(`${party} is readable on white cards and on every dark surface`, () => {
      expect(contrast(getPartyTone(party, 'light'), '#ffffff')).toBeGreaterThanOrEqual(4.5);
      for (const ground of ['#0e0a14', '#1c1030', '#3a1670']) {
        expect(contrast(getPartyTone(party, 'dark'), ground)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
