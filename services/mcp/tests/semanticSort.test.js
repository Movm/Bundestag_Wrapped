import { describe, it, expect } from 'vitest';
import { resolveFetchLimit, sortResultsByDate } from '../src/tools/semanticSearch.js';

const row = (date) => ({ payload: { date } });
const dateOf = (r) => r.payload.date;

describe('resolveFetchLimit', () => {
  it('returns the user limit unchanged for relevance', () => {
    expect(resolveFetchLimit(10, 'relevance')).toBe(10);
    expect(resolveFetchLimit(50, 'relevance')).toBe(50);
  });

  it('over-fetches for newest/oldest, clamped to [50, 200]', () => {
    expect(resolveFetchLimit(5, 'newest')).toBe(50); // 5*5=25 -> floor 50
    expect(resolveFetchLimit(20, 'newest')).toBe(100); // 20*5=100
    expect(resolveFetchLimit(50, 'oldest')).toBe(200); // 50*5=250 -> cap 200
  });
});

describe('sortResultsByDate', () => {
  it('leaves order untouched for relevance', () => {
    const rows = [row('2024-01-01'), row('2025-01-01')];
    expect(sortResultsByDate(rows, 'relevance', dateOf)).toBe(rows);
  });

  it('sorts newest first (descending)', () => {
    const rows = [row('2024-06-01'), row('2025-03-01'), row('2023-12-31')];
    const sorted = sortResultsByDate(rows, 'newest', dateOf).map(dateOf);
    expect(sorted).toEqual(['2025-03-01', '2024-06-01', '2023-12-31']);
  });

  it('sorts oldest first (ascending)', () => {
    const rows = [row('2024-06-01'), row('2025-03-01'), row('2023-12-31')];
    const sorted = sortResultsByDate(rows, 'oldest', dateOf).map(dateOf);
    expect(sorted).toEqual(['2023-12-31', '2024-06-01', '2025-03-01']);
  });

  it('sorts missing/empty dates to the END in both directions', () => {
    const rows = [row(''), row('2025-01-01'), row(null), row('2023-01-01')];
    expect(sortResultsByDate(rows, 'newest', dateOf).map(dateOf))
      .toEqual(['2025-01-01', '2023-01-01', '', null]);
    expect(sortResultsByDate(rows, 'oldest', dateOf).map(dateOf))
      .toEqual(['2023-01-01', '2025-01-01', '', null]);
  });
});
