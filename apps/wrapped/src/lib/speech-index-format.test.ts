import { expect, it } from 'vitest';
import { decodePostings, encodePostings, gramFilename, postingAt, canonicalizeRegexTerm, queryGrams } from './speech-index-format';

it('uses a stable binary representation for UTF-16 positions', () => {
  const wire = new Uint8Array([2, 0, 0, 0, 0, 172, 2]);
  expect(encodePostings([0, 300])).toEqual(wire);
  const decoded = decodePostings(wire.buffer, 300);
  expect([...decoded.positions]).toEqual([0, 300]);
  expect(postingAt(decoded, 300)).toBe(1);
  expect(postingAt(decoded, 299)).toBe(-1);
});
it.each([
  [], [255, 255, 255, 255], [1, 0, 0, 0, 128],
  [2, 0, 0, 0, 0, 0], [1, 0, 0, 0, 127], [0, 0, 0, 0, 0],
].map(bytes => ({ bytes })))('rejects malformed, excessive or out-of-corpus postings $bytes', ({ bytes }) => {
  expect(() => decodePostings(Uint8Array.from(bytes).buffer, 100)).toThrow();
});
it('uses UTF-16-safe file names even for punctuation and surrogate pairs', () => {
  expect(gramFilename('😀')).toBe('d83dde00.bin');
  expect(gramFilename('a/b')).toBe('0061002f0062.bin');
  expect(() => gramFilename('')).toThrow();
  expect(() => gramFilename('four')).toThrow();
});
it.each(['a', 'en', 'und', 'Deutschland', 'soziale Sicherheit', 'İ😀', 'a/b?'])('covers the entire substring without every overlapping triple: %s', term => {
  const covered = Array.from({ length: term.length }, () => false);
  for (const { gram, shift } of queryGrams(term)) {
    expect(gram).toBe(term.slice(shift, shift + gram.length));
    for (let i = 0; i < gram.length; i++) covered[shift + i] = true;
  }
  expect(covered.every(Boolean)).toBe(true);
});

it('preserves non-Unicode ignore-case equivalences that lowercase alone misses', () => {
  expect(canonicalizeRegexTerm('σς')).toBe('ΣΣ');
  expect(canonicalizeRegexTerm('µμ')).toBe('ΜΜ');
  expect(canonicalizeRegexTerm('ſsıi')).toBe('ſSıI');
  expect(canonicalizeRegexTerm('ß')).toBe('ß');
  for (const [a, b] of [['σ', 'ς'], ['µ', 'μ'], ['ſ', 's'], ['ı', 'i']]) {
    expect(canonicalizeRegexTerm(a) === canonicalizeRegexTerm(b)).toBe(new RegExp(a, 'i').test(b));
  }
});
