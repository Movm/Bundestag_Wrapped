import { expect, it } from 'vitest';
import { canonicalizeRegexTerm, queryGrams, type PostingList } from './speech-index-format';
import { matchIndexedTerm, parseStaticSpeechIndex } from './speech-index-model';
import { hasSearchContent, parseSearchQuery, searchSpeeches, sortSpeeches, type Speech } from './search-utils';

const texts = ['aaaaaa alpha a a', 'ς σ µμ μμ', 'e-mail (text) § 😀 İ', 'Klima und Energie', 'Migration statt Atomkraft', 'Bundesregierung und Bundesregierung', '', 'ab', 'cd'];
const corpus: Speech[] = texts.map((text, id) => ({ id, speaker: `Name ${id}`, party: id % 2 ? 'SPD' : 'GRÜNE', type: 'rede', category: 'rede', words: id * 10, text }));
const grams = new Map<string, number[]>();
let offset = 0;
for (const speech of corpus) {
  const text = speech.text.toLowerCase();
  for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= text.length; i++) {
    const key = text.slice(i, i + n), positions = grams.get(key) ?? [];
    positions.push(offset + i); grams.set(key, positions);
  }
  offset += text.length + 1;
}
const identity = { editionId: '2025', dataVersion: 'fixture', sourceSha256: 'a'.repeat(64), manifestSha256: 'b'.repeat(64) };
const document = { ...identity, version: 1, speakers: corpus.map(s => s.speaker), parties: ['GRÜNE', 'SPD'], types: ['rede'],
  rows: corpus.map((s, id) => [id, id % 2, 0, 0, s.words, s.text.toLowerCase().length, s.text.length]), grams: [...grams].map(([key, positions]) => [key, positions.length]) };
const index = parseStaticSpeechIndex(document, identity);
function matches(term: string, regex: boolean) {
  const pattern = regex ? canonicalizeRegexTerm(term) : term;
  const lists = new Map<string, PostingList>();
  for (const { gram } of queryGrams(pattern)) {
    const aliases = regex ? index.aliases.get(gram) ?? [] : [gram];
    const positions = aliases.flatMap(alias => grams.get(alias) ?? []).sort((a, b) => a - b);
    lists.set(gram, { positions: Uint32Array.from(positions) });
  }
  return matchIndexedTerm(term, index, lists, regex);
}
it.each(['', 'a', 'aa', 'aaaa', 'Klima AND Energie', 'Migration OR Klima', 'NOT Atomkraft', 'σ OR absent', 'μμ OR absent', '"μμ"', 'NOT μμ', 'e-mail', 'İ', '😀', '"a a"', 'a a', 'speaker:Name party:SPD words:>10', 'bcd'])('preserves all matching scores, filters and sort orders for %s', query => {
  const parsed = parseSearchQuery(query);
  const normal = new Map([...parsed.terms, ...parsed.phrases, ...parsed.notTerms].map(term => [term, matches(term, false)]));
  const frequencies = parsed.terms.map(term => matches(term, true));
  for (const filters of [{ party: '' }, { party: 'SPD' }, { party: '', minWords: 20, maxWords: 60 }]) {
    const expected = searchSpeeches(corpus, parsed, filters);
    const actual = searchSpeeches(index.entries.map(e => e.speech), parsed, filters, (_, id) => ({
      contains: term => normal.get(term)?.has(id) ?? false,
      frequency: termIndex => frequencies[termIndex].get(id)?.frequency ?? 0,
    }));
    for (const sort of ['relevance', 'date', 'words-desc', 'words-asc', 'speaker'] as const) {
      const summarize = (values: typeof actual) => sortSpeeches(values, sort, hasSearchContent(parsed)).map(s => [s.id, s.score, s._idx]);
      expect(summarize(actual)).toEqual(summarize(expected));
    }
  }
});
it('counts overlapping substring hits like the existing non-overlapping regex', () => {
  expect(matches('aaa', true).get(0)).toEqual({ first: 0, frequency: 2 });
  expect(matches('a', true).get(0)?.frequency).toBe(5);
  expect(matches('μμ', false).get(1)?.frequency).toBe(1);
  expect(matches('μμ', true).get(1)?.frequency).toBe(2);
});
it('rejects identity mismatches and invalid dictionary references', () => {
  expect(() => parseStaticSpeechIndex(document, { ...identity, sourceSha256: 'c'.repeat(64) })).toThrow();
  expect(() => parseStaticSpeechIndex({ ...document, rows: [[999, 0, 0, 0, 1, 1, 1]] }, identity)).toThrow();
  expect(() => parseStaticSpeechIndex({ ...document, grams: [['four', 1]] }, identity)).toThrow();
  expect(() => parseStaticSpeechIndex({ ...document, grams: [] }, identity)).toThrow();
});
