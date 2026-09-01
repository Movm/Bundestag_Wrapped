import { beforeEach, describe, expect, it } from 'vitest';
import { clearWrappedProgress, getWrappedProgress, setWrappedProgress } from './wrapped-storage';

const edition2025 = { editionId: '2025', dataVersion: 'frozen-1' };
const edition2026 = { editionId: '2026', dataVersion: 'preview-1' };

describe('wrapped storage', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
        get length() { return values.size; },
      } satisfies Storage,
    });
  });

  it('isolates progress between editions and data versions', () => {
    setWrappedProgress({ currentSection: 'quiz-1', quizAnswers: {} }, edition2025);
    setWrappedProgress({ currentSection: 'topics', quizAnswers: {} }, edition2026);

    expect(getWrappedProgress(edition2025)?.currentSection).toBe('quiz-1');
    expect(getWrappedProgress(edition2026)?.currentSection).toBe('topics');

    clearWrappedProgress(edition2025);
    expect(getWrappedProgress(edition2025)).toBeNull();
    expect(getWrappedProgress(edition2026)?.currentSection).toBe('topics');
  });

  it('clears progress for a slide that no longer exists in the active plan', () => {
    setWrappedProgress({ currentSection: 'quiz-removed', quizAnswers: {} }, edition2025);

    expect(getWrappedProgress(edition2025, ['intro', 'finale'])).toBeNull();
    expect(getWrappedProgress(edition2025)).toBeNull();
  });

  it('migrates the unversioned key exactly once to legacy', () => {
    window.localStorage.setItem('bundestag-wrapped-progress', JSON.stringify({ currentSection: 'topics', quizAnswers: {}, savedAt: Date.now() }));
    const legacy = { editionId: 'legacy', dataVersion: 'legacy' };

    expect(getWrappedProgress(legacy)?.currentSection).toBe('topics');
    expect(window.localStorage.getItem('bundestag-wrapped-progress')).toBeNull();
    expect(getWrappedProgress(legacy)?.currentSection).toBe('topics');
  });
});
