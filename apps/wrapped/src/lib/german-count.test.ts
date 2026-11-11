import { describe, expect, it } from 'vitest';
import { atParty, theParty, capitalize, cardinal, times } from './german-count';

describe('german-count', () => {
  it('spells small counts', () => {
    expect([1, 2, 6, 12].map(times)).toEqual(['einmal', 'zweimal', 'sechsmal', 'zwölfmal']);
    expect([2, 8, 12].map(cardinal)).toEqual(['zwei', 'acht', 'zwölf']);
  });

  it('falls back to digits above twelve', () => {
    expect(times(13)).toBe('13-mal');
    expect(times(1200)).toBe('1.200-mal');
    expect(cardinal(19)).toBe('19');
  });

  it('capitalizes', () => {
    expect(capitalize('zweimal')).toBe('Zweimal');
  });
});

describe('atParty', () => {
  it('puts the article before the group', () => {
    expect(['SPD', 'GRÜNE', 'DIE LINKE', 'BSW'].map(atParty)).toEqual(['bei der SPD', 'bei den Grünen', 'bei der Linken', 'bei BSW']);
  });
});

describe('theParty', () => {
  it('starts a sentence with the group', () => {
    expect(['SPD', 'GRÜNE', 'DIE LINKE', 'BSW'].map(theParty)).toEqual(['Die SPD', 'Die Grünen', 'Die Linke', 'BSW']);
  });
});
