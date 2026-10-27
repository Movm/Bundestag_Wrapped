import { describe, expect, it } from 'vitest';
import { SpeechSearchEngine } from './speech-search-engine';
import { parseSearchQuery, searchSpeeches, sortSpeeches, hasSearchContent, type Speech, type SpeechSortOption } from './search-utils';
import type { SpeechSearchRequest } from './speech-search-protocol';

const speeches: Speech[] = Array.from({ length: 125 }, (_, id) => ({ id, speaker: `Redner ${id}`, party: id % 2 ? 'SPD' : 'GRÜNE', type: 'Rede', category: 'rede', words: 100 + id,
  text: id % 3 ? 'Deutschland investiert in Klima und Energie. ' + 'Text '.repeat(100) : 'Migration und Bildung statt Atomkraft. ' + 'Text '.repeat(100) }));
function request(query: string, sort: SpeechSortOption = 'relevance'): Extract<SpeechSearchRequest, { type: 'search' }> {
  return { id: 1, type: 'search', manifestUrl: '/manifest.json', asset: 'speeches.json', query, sort, filters: { party: '' }, page: 0 };
}

describe('worker search semantics and bounded transfer', () => {
  it.each(['', 'Klima', 'klima AND energie NOT atomkraft', 'Migration OR Bildung', '"Deutschland investiert"', 'speaker:Redner party:SPD words:>150', 'NOT Atomkraft'])('preserves results and ordering for %s', query => {
    for (const sort of ['relevance', 'date', 'words-desc', 'words-asc', 'speaker'] as const) {
      const engine = new SpeechSearchEngine(speeches);
      const input = request(query, sort);
      const parsed = parseSearchQuery(query);
      const expected = sortSpeeches(searchSpeeches(speeches, parsed, input.filters), sort, hasSearchContent(parsed));
      const result = engine.search(input);
      expect(result.total).toBe(expected.length);
      expect(result.items.map(item => item.id)).toEqual(expected.slice(0, 50).map(item => item.id));
    }
  });
  it('pages without transferring full texts and retrieves details separately', () => {
    const engine = new SpeechSearchEngine(speeches);
    const first = engine.search(request(''));
    const second = engine.search({ ...request(''), page: 1 });
    expect(first.total).toBe(125);
    expect(first.items).toHaveLength(50);
    expect(second.items.map(item => item.id)).toEqual(speeches.slice(50, 100).map(item => item.id));
    expect(second.items.every(item => item.text === '' && item.preview!.length < 200)).toBe(true);
    expect(engine.detail(second.items[0].id)).toEqual(speeches[50]);
    expect(() => engine.detail(-1)).toThrow('Rede nicht gefunden');
  });
  it('assigns distinct detail identities when the export has no IDs', () => {
    const corpus = speeches.map(speech => { const copy = { ...speech }; delete (copy as Partial<Speech>).id; return copy; });
    const engine = new SpeechSearchEngine(corpus);
    const result = engine.search(request(''));
    expect(new Set(result.items.map(item => item.id)).size).toBe(50);
    for (const item of result.items) expect(engine.detail(item.id).speaker).toBe(item.speaker);
    expect(engine.detail(0).speaker).toBe('Redner 0');
    expect(engine.detail(1).speaker).toBe('Redner 1');
  });
  it('invalidates cached ordering after filter and query changes', () => {
    const engine = new SpeechSearchEngine(speeches);
    engine.search(request('Klima'));
    const input = { ...request(''), filters: { party: 'SPD', minWords: 150, maxWords: 200 } };
    const result = engine.search(input);
    expect(result.items.every(item => item.party === 'SPD' && item.words >= 150 && item.words <= 200)).toBe(true);
    expect(engine.search(request('no-match')).total).toBe(0);
  });
});
