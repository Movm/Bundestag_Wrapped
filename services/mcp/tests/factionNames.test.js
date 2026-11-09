import { describe, it, expect } from 'vitest';
import { normalizeDipFaction } from '../src/utils/factionNames.js';

describe('normalizeDipFaction', () => {
  it.each([
    ['BÜNDNIS 90/DIE GRÜNEN', 'Fraktion BÜNDNIS 90/DIE GRÜNEN'],
    ['CDU/CSU', 'Fraktion der CDU/CSU'],
    ['SPD', 'Fraktion der SPD'],
    ['AfD', 'Fraktion der AfD'],
    ['DIE LINKE', 'Fraktion DIE LINKE'],
    ['GRÜNE', 'Fraktion BÜNDNIS 90/DIE GRÜNEN'],
    ['  union ', 'Fraktion der CDU/CSU']
  ])('expands %s', (input, expected) => {
    expect(normalizeDipFaction(input)).toBe(expected);
  });

  it('passes unknown and already-full values through unchanged', () => {
    expect(normalizeDipFaction('Bundesregierung')).toBe('Bundesregierung');
    expect(normalizeDipFaction('Fraktion der SPD')).toBe('Fraktion der SPD');
    expect(normalizeDipFaction('Grün')).toBe('Grün');
    expect(normalizeDipFaction(undefined)).toBe(undefined);
  });
});
