import type { ScoredSpeech, SearchFilters, Speech, SpeechSortOption } from './search-utils';

export const SEARCH_PAGE_SIZE = 50;
export interface SpeechSearchPage { items: ScoredSpeech[]; total: number }
export type SpeechSearchRequest = { id: number } & (
  | { type: 'search'; manifestUrl: string; asset: string; query: string; filters: SearchFilters; sort: SpeechSortOption; page: number }
  | { type: 'detail'; speechId: number }
);
export type SpeechSearchResponse =
  | { id: number; type: 'page'; data: SpeechSearchPage }
  | { id: number; type: 'detail'; data: Speech }
  | { id: number; type: 'error'; message: string };
