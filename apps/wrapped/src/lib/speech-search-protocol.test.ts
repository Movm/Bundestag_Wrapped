import { expect, it } from 'vitest';
import { isSpeechSearchRequest } from './speech-search-protocol';
const search = { id: 1, type: 'search', manifestUrl: '/data/2025/final/manifest.json', asset: 'speeches.json', query: 'Klima', page: 0, sort: 'relevance', filters: { party: '' } };
it('accepts valid search and corpus-local detail messages', () => {
  expect(isSpeechSearchRequest(search)).toBe(true);
  expect(isSpeechSearchRequest({ id: 2, type: 'detail', speechId: 0 })).toBe(true);
});
it.each([null, 'message', {}, { ...search, id: NaN }, { ...search, page: -1 }, { ...search, sort: 'invalid' }, { ...search, filters: null }, { ...search, filters: { party: '', minWords: Infinity } }, { id: 1, type: 'detail', speechId: -1 }])('rejects malformed worker messages: %j', value => {
  expect(isSpeechSearchRequest(value)).toBe(false);
});
