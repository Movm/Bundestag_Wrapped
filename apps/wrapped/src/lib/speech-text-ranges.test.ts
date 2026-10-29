import { afterEach, expect, it, vi } from 'vitest';
import { fetchTextRanges, mergeByteRanges, parseByteParts, textFromParts, UnsupportedTextRanges } from './speech-text-ranges';
const url = `/data/2025/search-v1-${'a'.repeat(64)}-${'b'.repeat(64)}/texts.bin`;
const ascii = (text: string) => new TextEncoder().encode(text);
const concat = (...chunks: Uint8Array[]) => {
  const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
};
afterEach(() => vi.unstubAllGlobals());
it('parses nginx multipart ranges without replacing cut surrogate pairs', () => {
  const body = concat(ascii('\r\n--abc\r\nContent-Type: application/octet-stream\r\nContent-Range: bytes 0-3/20\r\n\r\n'),
    new Uint8Array([65, 0, 0, 216]), ascii('\r\n--abc\r\nContent-Range: bytes 10-13/20\r\n\r\n'), new Uint8Array([0, 222, 66, 0]), ascii('\r\n--abc--\r\n'));
  const parts = parseByteParts(body, 'multipart/byteranges; boundary=abc', null, 20);
  expect(textFromParts(parts, 0, 2)).toBe('A\uD800');
  expect(textFromParts(parts, 5, 2)).toBe('\uDE00B');
  expect(() => textFromParts(parts, 3, 2)).toThrow();
  expect(() => parseByteParts(body.slice(0, -5), 'multipart/byteranges; boundary=abc', null, 20)).toThrow();
  expect(() => parseByteParts(body, 'multipart/byteranges; boundary=abc', null, 22)).toThrow();
});
it('handles a merged single range and validates length and source identity', () => {
  const parts = parseByteParts(new Uint8Array([65, 0, 66, 0]), 'application/octet-stream', 'bytes 4-7/20', 20);
  expect(textFromParts(parts, 2, 2)).toBe('AB');
  expect(() => parseByteParts(new Uint8Array([1]), 'application/octet-stream', 'bytes 4-7/20', 20)).toThrow();
  expect(() => parseByteParts(new Uint8Array([1]), 'application/octet-stream', 'bytes 0-0/21', 20)).toThrow();
  expect(mergeByteRanges([{ start: 5, end: 8 }, { start: 0, end: 4 }, { start: 20, end: 22 }])).toEqual([{ start: 0, end: 8 }, { start: 20, end: 22 }]);
});
it('cancels a full-file response before consuming its body', async () => {
  const cancel = vi.fn().mockResolvedValue(undefined), arrayBuffer = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, headers: new Headers(), body: { cancel }, arrayBuffer }));
  await expect(fetchTextRanges(url, [{ start: 0, end: 3 }], 20)).rejects.toBeInstanceOf(UnsupportedTextRanges);
  expect(cancel).toHaveBeenCalledOnce();
  expect(arrayBuffer).not.toHaveBeenCalled();
});
it('requests only the merged bounded ranges and accepts a valid 206 response', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([65, 0, 66, 0]), { status: 206, headers: { 'content-type': 'application/octet-stream', 'content-range': 'bytes 0-3/20' } }));
  vi.stubGlobal('fetch', fetchMock);
  const parts = await fetchTextRanges(url, [{ start: 2, end: 3 }, { start: 0, end: 1 }], 20);
  expect(textFromParts(parts, 0, 2)).toBe('AB');
  expect(fetchMock).toHaveBeenCalledWith(url, { redirect: 'error', headers: { Range: 'bytes=0-3' } });
});
it('rejects excessive responses and untrusted or excessive requests', async () => {
  const cancel = vi.fn().mockResolvedValue(undefined);
  const fetchMock = vi.fn().mockResolvedValue({ status: 206, headers: new Headers({ 'content-length': '9999999' }), body: { cancel } });
  vi.stubGlobal('fetch', fetchMock);
  await expect(fetchTextRanges(url, [{ start: 0, end: 3 }], 20)).rejects.toThrow('Excessive preview response');
  expect(cancel).toHaveBeenCalledOnce();
  fetchMock.mockClear();
  await expect(fetchTextRanges('https://example.com/texts.bin', [{ start: 0, end: 3 }], 20)).rejects.toThrow();
  await expect(fetchTextRanges(url, [{ start: 0, end: 20000 }], 30000)).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
