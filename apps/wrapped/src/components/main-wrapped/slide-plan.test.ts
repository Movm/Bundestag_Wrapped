import { describe, expect, it } from 'vitest';
import type { EditionQuizModel } from '@/domain/edition-quiz';
import { countCorrectAnswers } from '@/stores/quizStore';
import { buildActiveSlidePlan, getQuizSlides, hasAvailableMoinQuiz } from './slide-plan';
import { normalizeSection } from './useScrollWrapped';

function quizModel(ids: (keyof EditionQuizModel)[]): EditionQuizModel {
  return Object.fromEntries(ids.map((id) => [id, { id }])) as EditionQuizModel;
}

describe('active slide plan', () => {
  it('removes only the matching speech story group', () => {
    const plan = buildActiveSlidePlan(
      quizModel(['quiz-topics', 'quiz-signature', 'quiz-drama', 'quiz-common-words', 'quiz-gender']),
      [],
    );

    expect(plan).not.toContain('intro-speeches');
    expect(plan).not.toContain('quiz-speeches');
    expect(plan).not.toContain('chart-speeches');
    expect(plan).toContain('quiz-topics');
    expect(plan).toContain('quiz-drama');
  });

  it('keeps no orphaned topic slides when the topic question is unavailable', () => {
    const plan = buildActiveSlidePlan(quizModel(['quiz-speeches']), []);

    expect(plan).not.toContain('intro-topics');
    expect(plan).not.toContain('info-topics');
    expect(plan).not.toContain('reveal-topics');
    expect(plan).toContain('quiz-speeches');
  });

  it.each([[[]], [[{ name: 'Person A', party: 'A' }]]])(
    'does not include a locked Moin quiz with fewer than two distinct options',
    (speakers) => {
      const plan = buildActiveSlidePlan(quizModel(['quiz-topics']), speakers);

      expect(hasAvailableMoinQuiz(speakers)).toBe(false);
      expect(plan).not.toContain('quiz-moin');
      expect(plan).not.toContain('intro-moin');
    },
  );

  it('derives total questions and score from the reduced plan', () => {
    const plan = buildActiveSlidePlan(
      quizModel(['quiz-topics', 'quiz-drama']),
      [{ name: 'Person A', party: 'A' }, { name: 'Person B', party: 'B' }],
    );
    const quizzes = getQuizSlides(plan);

    expect(quizzes).toEqual(['quiz-topics', 'quiz-drama', 'quiz-moin']);
    expect(countCorrectAnswers({ 'quiz-topics': true, 'quiz-drama': false, 'quiz-speeches': true }, quizzes)).toBe(1);
  });

  it('repairs persisted progress that points to a removed slide', () => {
    const plan = buildActiveSlidePlan(quizModel(['quiz-topics']), []);

    expect(normalizeSection('quiz-speeches', plan)).toBe('intro');
    expect(normalizeSection('quiz-topics', plan)).toBe('quiz-topics');
  });
});
