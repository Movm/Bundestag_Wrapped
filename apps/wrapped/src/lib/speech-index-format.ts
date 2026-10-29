/** Versioned static-search wire format. Positions count JavaScript UTF-16 units. */
export const SPEECH_INDEX_VERSION = 1;
export const PREVIEW_CHUNK_SIZE = 512;
export const PREVIEW_OVERLAP = 150;
export interface PostingList { positions: Uint32Array }

export function gramFilename(gram: string): string {
  if (gram.length < 1 || gram.length > 3) throw new Error('Invalid search gram');
  return Array.from({ length: gram.length }, (_, i) => gram.charCodeAt(i).toString(16).padStart(4, '0')).join('') + '.bin';
}

/** Non-overlapping triples plus the final triple cover every character exactly. */
export function queryGrams(term: string): { gram: string; shift: number }[] {
  if (!term) return [];
  const size = Math.min(3, term.length);
  const shifts: number[] = [];
  for (let shift = 0; shift + size <= term.length; shift += size) shifts.push(shift);
  if (shifts.at(-1) !== term.length - size) shifts.push(term.length - size);
  return shifts.map(shift => ({ gram: term.slice(shift, shift + size), shift }));
}

/** Delta-coded UTF-16 positions; regex frequency uses non-overlapping substrings. */
export function encodePostings(positions: readonly number[]): Uint8Array {
  const buffer = new Uint8Array(4 + positions.length * 5);
  new DataView(buffer.buffer).setUint32(0, positions.length, true);
  let cursor = 4, previous = 0;
  for (const position of positions) {
    let delta = position - previous;
    previous = position;
    while (delta >= 128) { buffer[cursor++] = (delta & 127) | 128; delta >>>= 7; }
    buffer[cursor++] = delta;
  }
  return buffer.slice(0, cursor);
}

export function decodePostings(buffer: ArrayBuffer, maxPosition: number): PostingList {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) throw new Error('Truncated search posting');
  const count = new DataView(buffer).getUint32(0, true);
  if (count > maxPosition + 1 || count > bytes.length - 4) throw new Error('Invalid search posting length');
  const positions = new Uint32Array(count);
  let cursor = 4, position = 0;
  for (let i = 0; i < count; i++) {
    let delta = 0, shift = 0, next: number;
    do {
      if (cursor >= bytes.length || shift > 28) throw new Error('Invalid search position');
      next = bytes[cursor++];
      delta += (next & 127) * 2 ** shift;
      shift += 7;
    } while (next & 128);
    position += delta;
    if (position > maxPosition || (i > 0 && delta === 0)) throw new Error('Search position outside corpus');
    positions[i] = position;
  }
  if (cursor !== bytes.length) throw new Error('Trailing search posting data');
  return { positions };
}

export function postingAt(list: PostingList, position: number): number {
  let low = 0, high = list.positions.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (list.positions[mid] < position) low = mid + 1; else high = mid;
  }
  return low < list.positions.length && list.positions[low] === position ? low : -1;
}
/** ECMA-262 Canonicalize for the existing non-Unicode /gi term regexes.
 * https://tc39.es/ecma262/2025/multipage/text-processing.html#sec-runtime-semantics-canonicalize-ch
 */
export function canonicalizeRegexTerm(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i], upper = char.toUpperCase();
    result += upper.length === 1 && !(char.charCodeAt(0) >= 128 && upper.charCodeAt(0) < 128) ? upper : char;
  }
  return result;
}
