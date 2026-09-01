import { describe, expect, it } from 'vitest';
import { buildMoinQuiz } from './moin-quiz';

const speakers = [
  { name: 'Person A', party: 'Partei A', count: 4 },
  { name: 'Person B', party: 'Partei B', count: 3 },
  { name: 'Person C', party: 'Partei C', count: 2 },
];

describe('buildMoinQuiz', () => {
  it.each([2, 3, 4])('keeps exactly one data-backed answer with %i options', (count) => {
    const quiz = buildMoinQuiz([...speakers, { name: 'Person D', party: 'Partei D', count: 1 }].slice(0, count));
    expect(quiz?.options).toHaveLength(count);
    expect(quiz?.options.filter((option) => option === quiz.correctAnswer)).toHaveLength(1);
  });

  it('is reproducible and refuses fewer than two options', () => {
    expect(buildMoinQuiz(speakers)).toEqual(buildMoinQuiz(speakers));
    expect(buildMoinQuiz(speakers.slice(0, 1))).toBeNull();
  });
});
