import { fetchJson, type SpeechesData } from '@/edition/loader';
import { validateContractDocument } from '@/data/wrapped-contract';
import { canonicalizeRegexTerm, decodePostings, gramFilename, queryGrams, type PostingList } from './speech-index-format';
import { matchIndexedTerm, type IndexedTextMatch, type StaticSpeechIndex } from './speech-index-model';
import { hasSearchContent, parseSearchQuery, searchSpeeches, sortSpeeches, type ParsedQuery, type ScoredSpeech, type Speech } from './search-utils';
import { SEARCH_PAGE_SIZE, toSpeechPreview, type SpeechSearchPage, type SpeechSearchRequest } from './speech-search-protocol';
import { fetchTextRanges, textFromParts, type ByteRange } from './speech-text-ranges';

type Search = Extract<SpeechSearchRequest, { type: 'search' }>;
export class MissingSearchIndexAsset extends Error {}
/** Keep network fan-out and retained decoded postings bounded across queries. */
class Resources {
  private active = 0;
  private pending: (() => void)[] = [];
  async run<T>(load: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    signal?.throwIfAborted();
    if (this.active >= 6) await new Promise<void>(resolve => this.pending.push(resolve));
    else this.active++;
    try { signal?.throwIfAborted(); return await load(); }
    finally { const next = this.pending.shift(); if (next) next(); else this.active--; }
  }
}
class AsyncLru<T> {
  private values = new Map<string, { promise: Promise<T>; bytes: number }>();
  private bytes = 0;
  constructor(privateSize: (value: T) => number, budget: number, maximum: number) {
    this.size = privateSize; this.budget = budget; this.maximum = maximum;
  }
  private size: (value: T) => number;
  private budget: number;
  private maximum: number;
  get(key: string, load: () => Promise<T>): Promise<T> {
    const existing = this.values.get(key);
    if (existing) { this.values.delete(key); this.values.set(key, existing); return existing.promise; }
    const entry = { promise: Promise.resolve().then(load), bytes: 0 };
    this.values.set(key, entry);
    entry.promise = entry.promise.then(value => {
      if (this.values.get(key) === entry) { entry.bytes = this.size(value); this.bytes += entry.bytes; this.trim(); }
      return value;
    }, error => { if (this.values.get(key) === entry) this.values.delete(key); throw error; });
    this.trim();
    return entry.promise;
  }
  clear() { this.values.clear(); this.bytes = 0; }
  private trim() {
    while (this.bytes > this.budget || this.values.size > this.maximum) {
      const first = this.values.keys().next().value;
      if (first === undefined) return;
      this.bytes -= this.values.get(first)!.bytes;
      this.values.delete(first);
    }
  }
}
interface QueryState { parsed: ParsedQuery; results: ScoredSpeech[]; matches: Map<string, Map<number, IndexedTextMatch>> }
interface PreviewRequest { speech: ScoredSpeech; start: number; end: number; originalStart: number; length: number; key: string }

export class StaticSpeechSearchEngine {
  private resources = new Resources();
  private postings = new AsyncLru<PostingList>(value => value.positions.byteLength, 32 * 1024 * 1024, 512);
  private previews = new Map<string, string>();
  private queryKey = '';
  private state?: Promise<QueryState>;
  private controller?: AbortController;
  private base: string;
  constructor(privateIndex: StaticSpeechIndex, indexUrl: string) {
    if (!/^\/data\/[A-Za-z0-9_-]+\/search-v[0-9]+-[a-f0-9]{64}-[a-f0-9]{64}\/index\.json$/.test(indexUrl)) throw new Error('Untrusted search index URL');
    this.index = privateIndex; this.base = indexUrl.slice(0, indexUrl.lastIndexOf('/'));
  }
  private index: StaticSpeechIndex;
  private async posting(gram: string, signal: AbortSignal): Promise<PostingList> {
    signal.throwIfAborted();
    const load = () => this.resources.run(async () => {
      const response = await fetch(`${this.base}/grams/${gramFilename(gram)}`, { redirect: 'error', signal });
      if (response.status === 404) throw new MissingSearchIndexAsset('Search posting unavailable');
      if (!response.ok) throw new Error(`Search posting: HTTP ${response.status}`);
      const list = decodePostings(await response.arrayBuffer(), this.index.end - 1);
      if (list.positions.length !== this.index.counts.get(gram)) throw new Error('Search posting count mismatch');
      return list;
    }, signal);
    try { return await this.postings.get(gram, load); }
    catch (error) {
      signal.throwIfAborted();
      // A newer query may have shared a fetch owned by the cancelled predecessor.
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return this.postings.get(gram, load);
      throw error;
    }
  }
  private async prepare(request: Search, signal: AbortSignal): Promise<QueryState> {
    const parsed = parseSearchQuery(request.query);
    const terms = [...new Set([...parsed.terms, ...parsed.phrases, ...parsed.notTerms])];
    const canonical = new Map<string, Promise<PostingList>>();
    const canonicalPosting = (gram: string) => {
      let promise = canonical.get(gram);
      if (!promise) {
        promise = Promise.all((this.index.aliases.get(gram) ?? []).map(alias => this.posting(alias, signal))).then(lists => {
          if (lists.length === 1) return lists[0];
          const positions = new Uint32Array(lists.reduce((sum, list) => sum + list.positions.length, 0));
          let cursor = 0;
          for (const list of lists) { positions.set(list.positions, cursor); cursor += list.positions.length; }
          positions.sort(); return { positions };
        });
        canonical.set(gram, promise);
      }
      return promise;
    };
    const matches = new Map<string, Map<number, IndexedTextMatch>>();
    const frequencies = new Map<string, Map<number, IndexedTextMatch>>();
    await Promise.all(terms.map(async term => {
      const parts = queryGrams(term);
      const valid = term.length <= this.index.maxLength && parts.every(part => this.index.counts.has(part.gram));
      const lists = valid ? new Map(await Promise.all([...new Set(parts.map(part => part.gram))].map(async gram => [gram, await this.posting(gram, signal)] as const))) : new Map<string, PostingList>();
      signal.throwIfAborted();
      const normal = valid ? matchIndexedTerm(term, this.index, lists) : new Map<number, IndexedTextMatch>();
      matches.set(term, normal);
      if (!parsed.terms.includes(term)) return;
      if (valid && parts.every(part => { const aliases = this.index.aliases.get(canonicalizeRegexTerm(part.gram)); return aliases?.length === 1 && aliases[0] === part.gram; })) { frequencies.set(term, normal); return; }
      const regexParts = queryGrams(canonicalizeRegexTerm(term));
      if (term.length > this.index.maxLength || regexParts.some(part => !this.index.regexCounts.has(part.gram))) { frequencies.set(term, new Map()); return; }
      const regexLists = new Map(await Promise.all([...new Set(regexParts.map(part => part.gram))].map(async gram => [gram, await canonicalPosting(gram)] as const)));
      signal.throwIfAborted();
      frequencies.set(term, matchIndexedTerm(term, this.index, regexLists, true));
    }));
    const results = sortSpeeches(searchSpeeches(this.index.entries.map(entry => entry.speech), parsed, request.filters, (_, id) => ({
      contains: term => matches.get(term)?.has(id) ?? false,
      frequency: termIndex => frequencies.get(parsed.terms[termIndex])?.get(id)?.frequency ?? 0,
    })), request.sort, hasSearchContent(parsed));
    return { parsed, matches, results };
  }
  async search(request: Search): Promise<SpeechSearchPage> {
    const key = JSON.stringify([request.query, request.filters, request.sort]);
    if (!this.state || key !== this.queryKey) {
      this.controller?.abort();
      this.controller = new AbortController();
      this.queryKey = key; this.state = this.prepare(request, this.controller.signal);
    }
    // Capture the state before awaiting: older requests cannot use a newer query's results.
    const pending = this.state, signal = this.controller!.signal;
    let state: QueryState;
    try { state = await pending; } catch (error) { if (this.state === pending) this.state = undefined; throw error; }
    signal.throwIfAborted();
    const page = Math.max(0, Math.floor(request.page));
    const selected = state.results.slice(page * SEARCH_PAGE_SIZE, (page + 1) * SEARCH_PAGE_SIZE);
    const previews: PreviewRequest[] = selected.map(speech => {
      const doc = this.index.entries[speech.id];
      const firstPositions = [...state.parsed.terms, ...state.parsed.phrases].map(term => state.matches.get(term)?.get(speech.id)?.first).filter((position): position is number => position !== undefined);
      const start = firstPositions.length ? Math.max(0, Math.min(...firstPositions) - 50) : 0;
      return { speech, start, end: Math.min(doc.length, start + 150), originalStart: doc.originalStart, length: doc.length, key: `${speech.id}:${start}` };
    });
    const captured = new Map(previews.filter(preview => this.previews.has(preview.key)).map(preview => [preview.key, this.previews.get(preview.key)!]));
    const missing = previews.filter(preview => preview.start < preview.end && !captured.has(preview.key));
    if (missing.length) {
      const ranges: ByteRange[] = missing.map(preview => ({ start: (preview.originalStart + preview.start) * 2, end: (preview.originalStart + preview.end) * 2 - 1 }));
      const parts = await this.resources.run(() => fetchTextRanges(`${this.base}/texts.bin`, ranges, this.index.textLength * 2, signal), signal);
      signal.throwIfAborted();
      for (const preview of missing) {
        const text = textFromParts(parts, preview.originalStart + preview.start, preview.end - preview.start);
        this.previews.set(preview.key, text); captured.set(preview.key, text);
      }
    }
    const items = previews.map(preview => {
      let snippet = captured.get(preview.key) ?? '';
      if (preview.start > 0) snippet = '...' + snippet;
      if (preview.end < preview.length) snippet += '...';
      return toSpeechPreview(preview.speech, snippet);
    });
    while (this.previews.size > 128) this.previews.delete(this.previews.keys().next().value!);
    return { items, total: state.results.length };
  }
  dispose() { this.controller?.abort(); this.state = undefined; this.postings.clear(); this.previews.clear(); }
  async detail(id: number): Promise<Speech> {
    if (!Number.isSafeInteger(id) || !this.index.entries[id]) throw new Error('Rede nicht gefunden');
    const url = `${this.base}/details/${id}.json`;
    const payload = await fetchJson(url);
    const data = validateContractDocument<SpeechesData>('SpeechesAsset', { speeches: [payload] }, url);
    if (data.speeches[0].id !== id) throw new Error('Speech detail identity mismatch');
    return data.speeches[0];
  }
}
