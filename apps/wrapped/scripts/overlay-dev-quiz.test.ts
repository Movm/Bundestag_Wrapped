import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyWinnerYears, overlayDevQuiz } from './overlay-dev-quiz.mjs';

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'));

describe('dev quiz overlay', () => {
  it('marks only the configured winner and clears stale marks', () => {
    const wrapped = {
      yearOverYear: { youthLanguage: { words: [
        { word: 'ragebait', count: 1 },
        { word: 'macher', count: 8, winnerYear: 2022 },
      ] } },
    };
    applyWinnerYears(wrapped, { terms: [{ word: 'ragebait', winner: 2026 }, { word: 'macher' }] });
    expect(wrapped.yearOverYear.youthLanguage.words).toEqual([
      { word: 'ragebait', count: 1, winnerYear: 2026 },
      { word: 'macher', count: 8 },
    ]);
  });

  it('applies the quiz config to the committed preview with valid checksums', () => {
    const outputRoot = mkdtempSync(path.join(tmpdir(), 'wrapped-dev-quiz-'));
    const { target, version } = overlayDevQuiz({ outputRoot });
    const manifest = readJson(path.join(target, 'manifest.json'));
    const quizConfig = readJson(path.resolve(import.meta.dirname, '../config/2026/quiz.json'));

    expect(manifest.dataVersion).toBe(version);
    expect(manifest.status).toBe('preview');
    expect(readJson(path.join(target, manifest.content)).quiz).toEqual(quizConfig);

    const checksums: Record<string, string> = readJson(path.join(target, manifest.checksums));
    for (const [relative, expected] of Object.entries(checksums)) {
      const actual = createHash('sha256').update(readFileSync(path.join(target, relative))).digest('hex');
      expect(actual, relative).toBe(expected);
    }

    const registry = readJson(path.join(outputRoot, 'editions.json'));
    expect(registry.currentEdition).toBe('2025');
    expect(registry.editions.find((entry: { id: string }) => entry.id === '2026').manifestUrl)
      .toBe(`/data/__dev-editions/2026/${version}/manifest.json`);
  });
});
