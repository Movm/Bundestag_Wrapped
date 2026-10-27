import { findBestSnippet, hasSearchContent, parseSearchQuery, searchSpeeches, sortSpeeches } from './search-utils';
import type { ScoredSpeech, Speech } from './search-utils';
import { SEARCH_PAGE_SIZE, type SpeechSearchPage, type SpeechSearchRequest } from './speech-search-protocol';

type SearchRequest = Extract<SpeechSearchRequest, { type: 'search' }>;
/** Owns the full corpus in the worker. Only bounded previews cross to the UI. */
export class SpeechSearchEngine {
  private results: ScoredSpeech[] = [];
  private queryKey = '';
  private byId: Map<number, Speech>;
  private speeches: Speech[];
  constructor(speeches: Speech[]) {
    // Published exports do not provide IDs. A corpus-local index uniquely
    // identifies previews, React keys and detail requests within this worker.
    this.speeches = speeches.map((speech, id) => ({ ...speech, id }));
    this.byId = new Map(this.speeches.map(speech => [speech.id, speech]));
  }
  search(request: SearchRequest): SpeechSearchPage {
    const { query, filters, sort } = request;
    const key = JSON.stringify([query, filters, sort]);
    const parsed = parseSearchQuery(query);
    if (key !== this.queryKey) {
      this.results = sortSpeeches(searchSpeeches(this.speeches, parsed, filters), sort, hasSearchContent(parsed));
      this.queryKey = key;
    }
    const page = Math.max(0, Math.floor(request.page));
    const items = this.results.slice(page * SEARCH_PAGE_SIZE, (page + 1) * SEARCH_PAGE_SIZE).map(speech => ({
      ...speech,
      preview: findBestSnippet(speech.text, [...parsed.terms, ...parsed.phrases], 150),
      text: '',
    }));
    return { items, total: this.results.length };
  }
  detail(id: number): Speech {
    const speech = this.byId.get(id);
    if (!speech) throw new Error('Rede nicht gefunden');
    return speech;
  }
}
