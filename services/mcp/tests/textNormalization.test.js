import { describe, it, expect } from 'vitest';
import {
  foldUmlauts,
  normalizeUnicodeNumbers,
  normalizeQuery,
  tokenizeQuery
} from '../src/utils/textNormalization.js';

describe('foldUmlauts', () => {
  it('folds lowercase umlauts and ß to ASCII', () => {
    expect(foldUmlauts('grün')).toBe('gruen');
    expect(foldUmlauts('Fraktionsvorsitzende')).toBe('Fraktionsvorsitzende');
    expect(foldUmlauts('Straße')).toBe('Strasse');
    expect(foldUmlauts('Öl über Ähren')).toBe('Oel ueber Aehren');
  });

  it('handles empty / nullish input safely', () => {
    expect(foldUmlauts('')).toBe('');
    expect(foldUmlauts(null)).toBe('');
    expect(foldUmlauts(undefined)).toBe('');
  });
});

describe('normalizeUnicodeNumbers', () => {
  it('converts subscript and superscript digits to ASCII', () => {
    expect(normalizeUnicodeNumbers('CO₂')).toBe('CO2');
    expect(normalizeUnicodeNumbers('m²')).toBe('m2');
    expect(normalizeUnicodeNumbers('x₃ + y³')).toBe('x3 + y3');
  });

  it('leaves plain text unchanged', () => {
    expect(normalizeUnicodeNumbers('Klimaschutz 2030')).toBe('Klimaschutz 2030');
  });
});

describe('normalizeQuery', () => {
  it('lowercases, folds umlauts and collapses whitespace', () => {
    expect(normalizeQuery('  Grüne   Politik ')).toBe('gruene politik');
  });

  it('joins hyphenated German words and strips soft hyphens', () => {
    expect(normalizeQuery('Klima-­schutz')).toBe('klimaschutz');
    expect(normalizeQuery('Sozial–politik')).toBe('sozialpolitik');
  });

  it('returns empty string for nullish input', () => {
    expect(normalizeQuery('')).toBe('');
    expect(normalizeQuery(null)).toBe('');
  });
});

describe('tokenizeQuery', () => {
  it('splits into word tokens preserving umlauts and digits', () => {
    expect(tokenizeQuery('Klimaschutz für 2030!')).toEqual(['Klimaschutz', 'für', '2030']);
  });

  it('drops punctuation and empty tokens', () => {
    expect(tokenizeQuery('a, b; c.')).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for nullish input', () => {
    expect(tokenizeQuery(null)).toEqual([]);
    expect(tokenizeQuery('')).toEqual([]);
  });
});
