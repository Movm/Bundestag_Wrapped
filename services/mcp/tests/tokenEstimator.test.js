import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  getSizeCategory,
  getContextUsage,
  analyzeSize,
  CONTEXT_WINDOWS
} from '../src/utils/tokenEstimator.js';

describe('estimateTokens', () => {
  it('returns zeroed metrics for empty / non-string input', () => {
    expect(estimateTokens('')).toMatchObject({ characters: 0, words: 0, estimatedTokens: 0 });
    expect(estimateTokens(null)).toMatchObject({ estimatedTokens: 0 });
    expect(estimateTokens(42)).toMatchObject({ estimatedTokens: 0 });
  });

  it('counts characters, words and lines', () => {
    const r = estimateTokens('eins zwei\ndrei', 'german');
    expect(r.characters).toBe('eins zwei\ndrei'.length);
    expect(r.words).toBe(3);
    expect(r.lines).toBe(2);
  });

  it('uses the German ratio (~3.2 chars/token) by default', () => {
    const text = 'x'.repeat(320);
    expect(estimateTokens(text).estimatedTokens).toBe(100);
  });

  it('uses a larger ratio for English (fewer tokens)', () => {
    const text = 'x'.repeat(400);
    expect(estimateTokens(text, 'english').estimatedTokens).toBe(100);
  });
});

describe('getSizeCategory', () => {
  it('classifies token counts into escalating categories', () => {
    expect(getSizeCategory(100).category).toBe('tiny');
    expect(getSizeCategory(1000).category).toBe('small');
    expect(getSizeCategory(5000).category).toBe('medium');
    expect(getSizeCategory(15000).category).toBe('large');
    expect(getSizeCategory(30000).category).toBe('very_large');
    expect(getSizeCategory(100000).category).toBe('massive');
  });
});

describe('getContextUsage', () => {
  it('reports usage for a specific known model', () => {
    const usage = getContextUsage(100000, 'gpt-4o');
    expect(usage['gpt-4o'].percentage).toBe('78.1');
    expect(usage['gpt-4o'].remaining).toBe(CONTEXT_WINDOWS['gpt-4o'] - 100000);
  });

  it('reports usage for all models when none specified', () => {
    const usage = getContextUsage(20000);
    expect(Object.keys(usage)).toEqual(Object.keys(CONTEXT_WINDOWS));
  });
});

describe('analyzeSize', () => {
  it('produces a combined analysis with a human-readable summary', () => {
    const r = analyzeSize('Deutscher Bundestag', { language: 'german' });
    expect(r).toHaveProperty('estimatedTokens');
    expect(r).toHaveProperty('category');
    expect(typeof r.summary).toBe('string');
    expect(r.summary).toContain('tokens');
  });

  it('scopes contextUsage to a single model when provided', () => {
    const r = analyzeSize('x'.repeat(3200), { model: 'gpt-4o' });
    expect(r.contextUsage).toHaveProperty('percentage');
    expect(r.contextUsage).toHaveProperty('remaining');
  });
});
