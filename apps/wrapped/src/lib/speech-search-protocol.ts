import type { EditionAssetTiming } from '@/edition/loader';
import type { ScoredSpeech, SearchFilters, Speech, SpeechSortOption } from './search-utils';

export const SEARCH_PAGE_SIZE = 50;
export interface SpeechSearchPage { items: ScoredSpeech[]; total: number }
export type SpeechSearchRequest = { id: number } & (
  | { type: 'search'; manifestUrl: string; asset: string; query: string; filters: SearchFilters; sort: SpeechSortOption; page: number }
  | { type: 'detail'; speechId: number }
);
export interface SpeechSearchTiming {
  backend?: 'index' | 'legacy' | 'legacy-fallback';
  queryIncludesResources?: boolean;
  cold: boolean;
  load?: EditionAssetTiming;
  engineMs: number;
  queryMs: number;
}
export type SpeechWorkerMessage = SpeechSearchResponse | { type: 'ready' };
export type SpeechSearchResponse =
  | { id: number; type: 'page'; data: SpeechSearchPage; timing?: SpeechSearchTiming }
  | { id: number; type: 'detail'; data: Speech }
  | { id: number; type: 'error'; message: string };

/** Validate the worker boundary independently of the caller's TypeScript types. */
export function isSpeechSearchRequest(value: unknown): value is SpeechSearchRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Record<string, unknown>;
  if (!Number.isSafeInteger(request.id) || (request.id as number) < 1) return false;
  if (request.type === 'detail') return Number.isSafeInteger(request.speechId) && (request.speechId as number) >= 0;
  if (request.type !== 'search' || typeof request.manifestUrl !== 'string' || typeof request.asset !== 'string' || typeof request.query !== 'string') return false;
  if (!Number.isSafeInteger(request.page) || (request.page as number) < 0) return false;
  if (!['relevance', 'date', 'words-desc', 'words-asc', 'speaker'].includes(request.sort as string)) return false;
  if (!request.filters || typeof request.filters !== 'object') return false;
  const filters = request.filters as Record<string, unknown>;
  return typeof filters.party === 'string' && [filters.minWords, filters.maxWords].every(value =>
    value === undefined || (typeof value === 'number' && Number.isFinite(value) && value >= 0));
}

/** Only the documented preview fields cross the worker boundary. */
export function toSpeechPreview(speech: ScoredSpeech, preview: string): ScoredSpeech {
  return { id: speech.id, speaker: speech.speaker, party: speech.party, type: speech.type ?? '', category: speech.category, words: speech.words,
    score: speech.score, _idx: speech._idx, text: '', preview };
}
