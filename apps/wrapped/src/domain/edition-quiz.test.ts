import { describe, expect, it } from 'vitest';
import { buildEditionQuizModel } from './edition-quiz';

function fixture(topic: string, party: string) {
  return {
    hotTopics: [topic, 'Zwei', 'Drei', 'Vier'],
    topicAnalysis: { topTopics: [{ topic, score: 1, rank: 1 }], byParty: {}, overall: {} },
    parties: [{ party, signatureWords: [{ word: `${topic}wort`, ratio: 2 }, { word: 'Zwei', ratio: 1.5 }, { word: 'Drei', ratio: 1.2 }, { word: 'Vier', ratio: 1.1 }] }],
    topSpeakersByWords: [{ name: 'Person A', party, totalWords: 1234, speeches: 2 }, { name: 'Person B', party: 'B', totalWords: 1200, speeches: 2 }, { name: 'Person C', party: 'C', totalWords: 1100, speeches: 2 }, { name: 'Person D', party: 'D', totalWords: 1000, speeches: 2 }],
    drama: { topZwischenrufer: [{ name: 'Rufer A', party, count: 4 }, { name: 'Rufer B', party: 'B', count: 3 }, { name: 'Rufer C', party: 'C', count: 2 }, { name: 'Rufer D', party: 'D', count: 1 }] },
    genderAnalysis: { byParty: [{ party, femaleRatio: 60 }, { party: 'B', femaleRatio: 50 }, { party: 'C', femaleRatio: 40 }, { party: 'D', femaleRatio: 30 }] },
  };
}

describe('buildEditionQuizModel', () => {
  it('uses fixture evidence and returns stable options', () => {
    const first = buildEditionQuizModel(fixture('Europa', 'Partei A') as never);
    const second = buildEditionQuizModel(fixture('Klima', 'Partei B') as never);
    expect(first['quiz-topics']?.correctAnswer).toBe('Europa');
    expect(second['quiz-topics']?.correctAnswer).toBe('Klima');
    expect(first['quiz-drama']?.correctAnswer).toContain('Rufer A');
    expect(buildEditionQuizModel(fixture('Europa', 'Partei A') as never)['quiz-topics']).toEqual(first['quiz-topics']);
  });

  it('keeps independent later questions when the top-topic metric is missing', () => {
    const data = fixture('Europa', 'Partei A');
    data.hotTopics = [];
    data.topicAnalysis = { topTopics: [], byParty: {}, overall: {} };

    const model = buildEditionQuizModel(data as never);

    expect(model['quiz-topics']).toBeUndefined();
    expect(model['quiz-speeches']).toBeDefined();
    expect(model['quiz-drama']).toBeDefined();
    expect(model['quiz-gender']).toBeDefined();
  });

  it('only omits the speech question when its metric is missing', () => {
    const data = fixture('Europa', 'Partei A');
    data.topSpeakersByWords = [];

    const model = buildEditionQuizModel(data as never);

    expect(model['quiz-speeches']).toBeUndefined();
    expect(model['quiz-topics']).toBeDefined();
    expect(model['quiz-drama']).toBeDefined();
  });

  it('omits a question when fewer than four distinct answers are evidenced', () => {
    const data = fixture('Europa', 'Partei A');
    data.hotTopics = ['Europa', 'Klima', 'Haushalt'];
    data.topicAnalysis = { topTopics: [{ topic: 'Europa', score: 1, rank: 1 }], byParty: {}, overall: {} };

    expect(buildEditionQuizModel(data as never)['quiz-topics']).toBeUndefined();
  });

  it('does not hide unexpected builder errors', () => {
    const data = fixture('Europa', 'Partei A');
    data.parties = null as never;

    expect(() => buildEditionQuizModel(data as never)).toThrow();
  });
});
