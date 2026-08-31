import { describe, expect, it } from 'vitest';
import { deterministicDecoys, MissingMetricError, resolveTemplate, topTopic } from './metrics';

describe('edition metrics', () => {
  it('uses the edition top topic instead of a hard-coded quiz answer', () => {
    expect(topTopic({ topicAnalysis: { topTopics: [{ topic: 'Europa' }] }, hotTopics: ['Finanzen'] } as never)).toBe('Europa');
  });
  it('keeps decoys deterministic', () => {
    const answer = { party: 'SPD' };
    expect(deterministicDecoys([{ party: 'CDU' }, answer, { party: 'AfD' }], answer)).toEqual([{ party: 'AfD' }, { party: 'CDU' }]);
  });
  it('rejects unresolved template values', () => {
    expect(() => resolveTemplate('Top: {{topic}}', {})).toThrow(MissingMetricError);
  });
});
