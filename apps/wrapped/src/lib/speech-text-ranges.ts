/** Bounded previews from one static UTF-16LE file, using one multipart request. */
export interface ByteRange { start: number; end: number }
export interface BytePart extends ByteRange { bytes: Uint8Array }
export class UnsupportedTextRanges extends Error {}

export function mergeByteRanges(ranges: ByteRange[]): ByteRange[] {
  const result: ByteRange[] = [];
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    if (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) || range.start < 0 || range.end < range.start) throw new Error('Invalid preview range');
    const previous = result.at(-1);
    if (previous && range.start <= previous.end + 1) previous.end = Math.max(previous.end, range.end);
    else result.push({ ...range });
  }
  return result;
}
function contentRange(header: string | null, total: number): ByteRange {
  const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(header ?? '');
  if (!match) throw new Error('Missing preview content range');
  const start = Number(match[1]), end = Number(match[2]);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end >= total || Number(match[3]) !== total) throw new Error('Preview range outside source');
  return { start, end };
}
export function parseByteParts(bytes: Uint8Array, type: string, range: string | null, total: number): BytePart[] {
  if (!/^multipart\/byteranges\b/i.test(type)) {
    const part = contentRange(range, total);
    if (bytes.length !== part.end - part.start + 1) throw new Error('Truncated preview range');
    return [{ ...part, bytes }];
  }
  const boundary = /;\s*boundary=(?:"([A-Za-z0-9_-]{1,70})"|([A-Za-z0-9_-]{1,70}))\s*$/i.exec(type);
  if (!boundary) throw new Error('Invalid preview boundary');
  const marker = new TextEncoder().encode(`--${boundary[1] ?? boundary[2]}`);
  const matches = (cursor: number, sequence: Uint8Array) => sequence.every((byte, i) => bytes[cursor + i] === byte);
  const crlf = new Uint8Array([13, 10]);
  let cursor = matches(0, crlf) ? 2 : 0;
  const parts: BytePart[] = [];
  for (;;) {
    if (!matches(cursor, marker)) throw new Error('Missing preview boundary');
    cursor += marker.length;
    if (bytes[cursor] === 45 && bytes[cursor + 1] === 45) {
      cursor += 2;
      if (matches(cursor, crlf)) cursor += 2;
      if (cursor !== bytes.length || !parts.length) throw new Error('Invalid preview ending');
      return parts;
    }
    if (!matches(cursor, crlf)) throw new Error('Invalid preview separator');
    cursor += 2;
    const headerStart = cursor;
    while (cursor + 3 < bytes.length && !(bytes[cursor] === 13 && bytes[cursor + 1] === 10 && bytes[cursor + 2] === 13 && bytes[cursor + 3] === 10)) {
      if (cursor - headerStart > 4096) throw new Error('Excessive preview headers');
      cursor++;
    }
    if (cursor + 3 >= bytes.length) throw new Error('Truncated preview headers');
    const headers = new TextDecoder().decode(bytes.subarray(headerStart, cursor));
    const part = contentRange(/^content-range:\s*([^\r\n]+)$/im.exec(headers)?.[1]?.trim() ?? null, total);
    cursor += 4;
    const end = cursor + part.end - part.start + 1;
    if (end > bytes.length) throw new Error('Truncated preview body');
    parts.push({ ...part, bytes: bytes.subarray(cursor, end) });
    if (parts.length > 50 || !matches(end, crlf)) throw new Error('Invalid preview part count or separator');
    cursor = end + 2;
  }
}
export function textFromParts(parts: BytePart[], start: number, length: number): string {
  if (length === 0) return '';
  const first = start * 2, last = first + length * 2 - 1;
  const part = parts.find(part => part.start <= first && part.end >= last);
  if (!part) throw new Error('Preview response omitted requested text');
  const view = new DataView(part.bytes.buffer, part.bytes.byteOffset + first - part.start, length * 2);
  let text = '';
  // Preserve unpaired surrogates exactly, including those cut by the old snippet API.
  for (let i = 0; i < length; i++) text += String.fromCharCode(view.getUint16(i * 2, true));
  return text;
}
export async function fetchTextRanges(url: string, ranges: ByteRange[], total: number, signal?: AbortSignal): Promise<BytePart[]> {
  if (!/^\/data\/[A-Za-z0-9_-]+\/search-v[0-9]+-[a-f0-9]{64}-[a-f0-9]{64}\/texts\.bin$/.test(url)) throw new Error('Untrusted preview URL');
  if (ranges.length > 50) throw new Error('Excessive preview request');
  const merged = mergeByteRanges(ranges);
  if (!merged.length) return [];
  if (merged.length > 50 || merged.some(range => range.end >= total) || merged.reduce((sum, range) => sum + range.end - range.start + 1, 0) > 150 * 2 * 50) throw new Error('Excessive preview request');
  const response = await fetch(url, { headers: { Range: `bytes=${merged.map(range => `${range.start}-${range.end}`).join(',')}` }, redirect: 'error', ...(signal ? { signal } : {}) });
  if (response.status !== 206 || ![null, 'identity'].includes(response.headers.get('content-encoding'))) {
    // Never consume an entire corpus when an origin/proxy ignores Range.
    await response.body?.cancel();
    throw new UnsupportedTextRanges('Origin does not serve bounded text ranges');
  }
  const declaredLength = Number(response.headers.get('content-length'));
  const maximum = 150 * 2 * 50 + 4096 * 50;
  if (declaredLength > maximum) { await response.body?.cancel(); throw new Error('Excessive preview response'); }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing preview response body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximum) { await reader.cancel(); throw new Error('Excessive preview response'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return parseByteParts(bytes, response.headers.get('content-type') ?? '', response.headers.get('content-range'), total);
}
