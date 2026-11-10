import { describe, expect, it } from 'vitest';
import { pickQuizLayout, QUIZ_LAYOUTS } from './layouts';
import { QUIZ_LAYOUT_REGISTRY } from './registry';

const short = ['Wirtschaft', 'Sicherheit', 'Klima', 'Finanzen'];
const long = ['Awet Tesfaiesus (GRÜNE)', 'Friedrich Merz (CDU/CSU)', 'Lars Klingbeil (SPD)', 'Alice Weidel (AfD)'];

describe('quiz layout picking', () => {
  it('registers only known layouts, each once', () => {
    const ids = QUIZ_LAYOUT_REGISTRY.map(spec => spec.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(QUIZ_LAYOUTS).toContain(id);
  });

  it('honours an explicit layout that fits', () => {
    expect(pickQuizLayout(QUIZ_LAYOUT_REGISTRY, short, { preferred: 'tiles', seed: 'x' }).id).toBe('tiles');
  });

  it('ignores an explicit layout that does not fit and stays deterministic', () => {
    const first = pickQuizLayout(QUIZ_LAYOUT_REGISTRY, long, { preferred: 'stack', seed: 'quiz-youth-language' });
    expect(first.id).not.toBe('stack');
    expect(pickQuizLayout(QUIZ_LAYOUT_REGISTRY, long, { preferred: 'stack', seed: 'quiz-youth-language' }).id).toBe(first.id);
  });

  it('uses layouts with their own mechanic (swipe, gap) only when pinned', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'quiz-topics', 'quiz-speeches']) {
      expect(['swipe', 'gap']).not.toContain(pickQuizLayout(QUIZ_LAYOUT_REGISTRY, short, { seed, gapSentence: 'Platz 1 ist {answer}.' }).id);
    }
    expect(pickQuizLayout(QUIZ_LAYOUT_REGISTRY, short, { seed: 'x', preferred: 'swipe' }).id).toBe('swipe');
  });

  it('rotates layouts across quizzes', () => {
    const seeds = ['quiz-topics', 'quiz-signature', 'quiz-speeches', 'quiz-drama', 'quiz-moin', 'quiz-tone', 'quiz-topic-riser'];
    const picked = new Set(seeds.map(seed => pickQuizLayout(QUIZ_LAYOUT_REGISTRY, short, { seed }).id));
    expect(picked.size).toBeGreaterThan(1);
  });
});
