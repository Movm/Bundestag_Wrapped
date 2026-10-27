import { describe, expect, it } from 'vitest';
import { buildWordSearchIndex } from './word-search-data';

describe('edition word search index', () => {
  it('merges shared words and uses speech word totals for frequencies', () => {
    expect(buildWordSearchIndex({ parties: [
      { party: 'Alpha', words: [{ word: 'Klima', count: 5 }, { word: 'Klima', count: 3 }] },
      { party: 'Beta', words: [{ word: 'Klima', count: 2 }, { word: 'Europa', count: 1 }] },
    ] }, [{ party: 'Alpha', totalWords: 2000 }, { party: 'Beta', totalWords: 1000 }])).toEqual({ words: [
      { word: 'Klima', total: 10, parties: { Alpha: { count: 8, per1000: 4 }, Beta: { count: 2, per1000: 2 } } },
      { word: 'Europa', total: 1, parties: { Beta: { count: 1, per1000: 1 } } },
    ] });
  });
  it('supports an empty validated asset', () => {
    expect(buildWordSearchIndex({ parties: [] }, [])).toEqual({ words: [] });
  });
  it('never emits non-finite frequencies when a denominator is unavailable', () => {
    expect(buildWordSearchIndex({ parties: [{ party: 'Alpha', words: [{ word: 'Klima', count: 1 }] }] }, []).words[0].parties.Alpha.per1000).toBe(0);
  });
});
