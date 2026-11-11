import { describe, expect, it } from 'vitest';
import { seededShuffle } from './layouts';

describe('seededShuffle', () => {
  const options = ['richtig', 'b', 'c', 'd'];

  it('is a stable permutation for the same seed', () => {
    expect(seededShuffle(options, 'quiz-genz:Frage')).toEqual(seededShuffle(options, 'quiz-genz:Frage'));
    expect([...seededShuffle(options, 'x')].sort()).toEqual([...options].sort());
  });

  it('does not keep the answer-first order across questions', () => {
    const positions = Array.from({ length: 40 }, (_, index) => seededShuffle(options, `quiz-${index}`).indexOf('richtig'));
    expect(new Set(positions).size).toBe(4);
    expect(positions.filter(position => position === 0).length).toBeLessThan(20);
  });
});
