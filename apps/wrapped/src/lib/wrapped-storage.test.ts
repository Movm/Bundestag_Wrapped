import { beforeEach, describe, expect, it } from 'vitest';
import { clearWrappedProgress, getWrappedProgress, setWrappedProgress } from './wrapped-storage';

const edition2025 = { editionId: '2025', dataVersion: 'frozen-1' };
const edition2026 = { editionId: '2026', dataVersion: 'preview-1' };

describe('wrapped storage', () => {
  beforeEach(() => localStorage.clear());

  it('isolates progress between editions and data versions', () => {
    setWrappedProgress({ currentSection: 'quiz-1', quizAnswers: {} }, edition2025);
    setWrappedProgress({ currentSection: 'topics', quizAnswers: {} }, edition2026);

    expect(getWrappedProgress(edition2025)?.currentSection).toBe('quiz-1');
    expect(getWrappedProgress(edition2026)?.currentSection).toBe('topics');

    clearWrappedProgress(edition2025);
    expect(getWrappedProgress(edition2025)).toBeNull();
    expect(getWrappedProgress(edition2026)?.currentSection).toBe('topics');
  });

  it('migrates the unversioned key exactly once to legacy', () => {
    localStorage.setItem('bundestag-wrapped-progress', JSON.stringify({ currentSection: 'topics', quizAnswers: {}, savedAt: Date.now() }));
    const legacy = { editionId: 'legacy', dataVersion: 'legacy' };

    expect(getWrappedProgress(legacy)?.currentSection).toBe('topics');
    expect(localStorage.getItem('bundestag-wrapped-progress')).toBeNull();
    expect(getWrappedProgress(legacy)?.currentSection).toBe('topics');
  });
});
