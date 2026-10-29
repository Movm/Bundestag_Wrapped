import type { Speech } from './search-utils';
import { canonicalizeRegexTerm, postingAt, queryGrams, SPEECH_INDEX_VERSION, type PostingList } from './speech-index-format.ts';

export interface IndexedSpeech { speech: Speech; start: number; originalStart: number; lowerLength: number; length: number }
export interface StaticSpeechIndex { entries: IndexedSpeech[]; counts: Map<string, number>; regexCounts: Map<string, number>; aliases: Map<string, string[]>; end: number; textLength: number; maxLength: number }
export interface IndexIdentity { editionId: string; dataVersion: string; manifestSha256: string; sourceSha256: string }
export interface IndexedTextMatch { first: number; frequency: number }
const invalid = (): never => { throw new Error('Invalid static speech index'); };
function strings(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) return invalid();
  return value;
}
export function parseStaticSpeechIndex(value: unknown, identity: IndexIdentity): StaticSpeechIndex {
  if (!value || typeof value !== 'object') return invalid();
  const index = value as Record<string, unknown>;
  if (index.version !== SPEECH_INDEX_VERSION || Object.entries(identity).some(([key, expected]) => index[key] !== expected)) return invalid();
  const speakers = strings(index.speakers), parties = strings(index.parties), types = strings(index.types);
  if (!Array.isArray(index.rows) || !Array.isArray(index.grams)) return invalid();
  let start = 0, originalStart = 0, maxLength = 0;
  const entries: IndexedSpeech[] = index.rows.map((row, id) => {
    if (!Array.isArray(row) || row.length !== 7 || row.some(n => !Number.isSafeInteger(n) || n < 0)) return invalid();
    const [speaker, party, type, category, words, lowerLength, length] = row as number[];
    if (speaker >= speakers.length || party >= parties.length || type >= types.length || category > 1 || start + lowerLength >= 2 ** 30 || originalStart + length >= 2 ** 30) return invalid();
    const entry = { speech: { id, speaker: speakers[speaker], party: parties[party], type: types[type], category: category === 0 ? 'rede' as const : 'wortbeitrag' as const, words, text: '' }, start, originalStart, lowerLength, length };
    start += lowerLength + 1; originalStart += length; maxLength = Math.max(maxLength, lowerLength);
    return entry;
  });
  const counts = new Map<string, number>();
  const actualTotals = [0, 0, 0, 0];
  for (const row of index.grams) {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || row[0].length < 1 || row[0].length > 3 || !Number.isSafeInteger(row[1]) || row[1] < 1 || row[1] > start || counts.has(row[0])) return invalid();
    counts.set(row[0], row[1]); actualTotals[row[0].length] += row[1];
  }
  for (let n = 1; n <= 3; n++) {
    const expected = entries.reduce((sum, entry) => sum + Math.max(0, entry.lowerLength - n + 1), 0);
    if (actualTotals[n] !== expected) return invalid();
  }
  const regexCounts = new Map<string, number>(), aliases = new Map<string, string[]>();
  for (const [gram, count] of counts) {
    const canonical = canonicalizeRegexTerm(gram);
    regexCounts.set(canonical, (regexCounts.get(canonical) ?? 0) + count);
    const values = aliases.get(canonical) ?? [];
    values.push(gram); aliases.set(canonical, values);
  }
  return { entries, counts, regexCounts, aliases, end: start, textLength: originalStart, maxLength };
}

/** Exact substrings and capped non-overlapping regex frequency without source texts. */
export function matchIndexedTerm(term: string, index: StaticSpeechIndex, lists: Map<string, PostingList>, regex = false): Map<number, IndexedTextMatch> {
  const hits = new Map<number, IndexedTextMatch>();
  if (regex) term = canonicalizeRegexTerm(term);
  const counts = regex ? index.regexCounts : index.counts;
  const parts = queryGrams(term);
  if (!parts.length || term.length > index.maxLength || parts.some(part => !counts.has(part.gram))) return hits;
  if (parts.some(part => !lists.has(part.gram))) throw new Error('Missing search posting');
  const anchor = parts.reduce((best, part) => lists.get(part.gram)!.positions.length < lists.get(best.gram)!.positions.length ? part : best);
  const anchorList = lists.get(anchor.gram)!;
  let docId = 0;
  const ends = new Map<number, number>();
  for (let i = 0; i < anchorList.positions.length; i++) {
    const position = anchorList.positions[i] - anchor.shift;
    if (position < 0) continue;
    let matched = true;
    for (const part of parts) {
      const list = lists.get(part.gram)!;
      const found = part === anchor ? i : postingAt(list, position + part.shift);
      if (found < 0) { matched = false; break; }
    }
    if (!matched) continue;
    while (docId + 1 < index.entries.length && index.entries[docId + 1].start <= position) docId++;
    const doc = index.entries[docId];
    if (!doc || position + term.length > doc.start + doc.lowerLength) continue;
    let hit = hits.get(docId);
    if (!hit) { hit = { first: position - doc.start, frequency: 0 }; hits.set(docId, hit); }
    if (position >= (ends.get(docId) ?? -1)) {
      hit.frequency = Math.min(5, hit.frequency + 1);
      ends.set(docId, position + term.length);
    }
    // Ranking caps frequency at five; later occurrences cannot change this row.
    if (hit.frequency === 5) {
      let low = i + 1, high = anchorList.positions.length;
      const end = doc.start + doc.lowerLength;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (anchorList.positions[mid] < end) low = mid + 1; else high = mid;
      }
      i = low - 1;
    }
  }
  return hits;
}
