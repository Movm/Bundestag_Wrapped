import { describe, expect, it } from 'vitest';
import { selectDisplayParties } from './party-selection';

describe('selectDisplayParties', () => {
  it('uses fixture scores, excludes only fraktionslos, and has a stable tie-breaker', () => {
    const parties = {
      'Team Z': { economy: 2 }, 'Team A': { economy: 2 }, 'Team B': { economy: 6 },
      'Team C': { economy: 5 }, 'Team D': { economy: 4 }, 'Team E': { economy: 3 },
      fraktionslos: { economy: 99 },
    };
    expect(selectDisplayParties(parties)).toEqual(['Team B', 'Team C', 'Team D', 'Team E', 'Team A']);
  });
});
