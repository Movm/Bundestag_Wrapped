import { beforeEach, describe, expect, it } from 'vitest';
import { quizScope, useQuizStore } from './quizStore';

const first = { editionId: 'fixture-a', dataVersion: 'v1' };
const second = { editionId: 'fixture-b', dataVersion: 'v1' };
const revised = { editionId: 'fixture-a', dataVersion: 'v2' };

describe('edition-scoped quiz state', () => {
  beforeEach(() => useQuizStore.setState({ answersByScope: {} }));

  it('keeps identical slide IDs isolated between editions and versions', () => {
    useQuizStore.getState().answerQuiz(first, 'quiz-topics', true);
    useQuizStore.getState().answerQuiz(second, 'quiz-topics', false);

    expect(useQuizStore.getState().answersByScope[quizScope(first)]).toEqual({ 'quiz-topics': true });
    expect(useQuizStore.getState().answersByScope[quizScope(second)]).toEqual({ 'quiz-topics': false });
    expect(useQuizStore.getState().answersByScope[quizScope(revised)]).toBeUndefined();
  });

  it('clears only the active edition scope', () => {
    useQuizStore.getState().answerQuiz(first, 'quiz-topics', true);
    useQuizStore.getState().answerQuiz(second, 'quiz-topics', false);
    useQuizStore.getState().clearProgress(first);

    expect(useQuizStore.getState().answersByScope[quizScope(first)]).toBeUndefined();
    expect(useQuizStore.getState().answersByScope[quizScope(second)]).toEqual({ 'quiz-topics': false });
  });
});
