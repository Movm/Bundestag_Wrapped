import { describe, expect, it } from 'vitest';
import { applyEditionQuizConfiguration, buildEditionQuizModel } from './edition-quiz';
import edition2025 from '../../public/data/2025/final/wrapped.json';
import content2025 from '../../public/data/2025/final/content.json';
import quiz2026 from '../../config/2026/quiz.json';
import { buildActiveSlidePlan, getQuizSlides } from '@/components/main-wrapped/slide-plan';
import type { WrappedData } from '@/data/wrapped';

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

  it('builds year-over-year and youth-language questions from comparison evidence', () => {
    const data = {
      ...fixture('Europa', 'Partei A'),
      yearOverYear: {
        baseline: { editionId: '2025', start: '2025-01-01', end: '2025-12-31' },
        topics: [
          { label: 'Wirtschaft', currentRank: 1, previousRank: 4, rankChange: 3 },
          { label: 'Europa', currentRank: 2, previousRank: 3, rankChange: 1 },
          { label: 'Soziales', currentRank: 3, previousRank: 2, rankChange: -1 },
          { label: 'Finanzen', currentRank: 4, previousRank: 1, rankChange: -3 },
        ],
        words: [
          { label: 'mensch', currentRank: 1, previousRank: 3, rankChange: 2 },
          { label: 'dank', currentRank: 2, previousRank: 4, rankChange: 2 },
          { label: 'land', currentRank: 3, previousRank: 1, rankChange: -2 },
          { label: 'euro', currentRank: 4, previousRank: 2, rankChange: -2 },
        ],
        youthLanguage: {
          lexiconVersion: 'test-v1',
          words: [
            { word: 'safe', count: 9, previousCount: 4, change: 5 },
            { word: 'wild', count: 7, previousCount: 8, change: -1 },
            { word: 'bro', count: 5, previousCount: 1, change: 4 },
            { word: 'lowkey', count: 3, previousCount: 0, change: 3 },
          ],
          byParty: [
            { party: 'Partei A', count: 9 },
            { party: 'Partei B', count: 7 },
            { party: 'Partei C', count: 5 },
            { party: 'Partei D', count: 3 },
          ],
        },
      },
    };

    const model = buildEditionQuizModel(data as never);

    expect(model['quiz-topic-riser']?.correctAnswer).toBe('Wirtschaft');
    expect(model['quiz-word-riser']?.correctAnswer).toBe('mensch');
    expect(model['quiz-word-riser']?.question).toBe('Was ist das Aufsteigerwort des Jahres?');
    expect(model['quiz-youth-language']?.correctAnswer).toBe('safe');
    expect(model['quiz-youth-language']?.explanation).toContain('Partei A');
  });
});

describe('edition quiz configuration', () => {
  it('starts the 2026 edition with the word-riser question', () => {
    expect(quiz2026.groups[0]?.id).toBe('quiz-word-riser');
  });

  it('preserves the rendered 2025 quiz model when no configuration exists', () => {
    expect((content2025 as { quiz?: unknown }).quiz).toBeUndefined();
    const data2025 = edition2025 as WrappedData;
    const model = buildEditionQuizModel(data2025);
    expect(model).toMatchSnapshot('questions');
    // Keep the original complete 2025 reference snapshot stable as well.
    expect(model).toMatchSnapshot();
    expect(getQuizSlides(buildActiveSlidePlan(model, data2025.moinSpeakers))).toMatchSnapshot('group order');
  });

  it('keeps the generated 2025-compatible model unchanged when configuration is absent', () => {
    const generated = buildEditionQuizModel(fixture('Europa', 'Partei A') as never);
    expect(applyEditionQuizConfiguration(generated)).toBe(generated);
  });

  it('uses one ordered list to hide, reorder, override and add questions', () => {
    const generated = buildEditionQuizModel(fixture('Europa', 'Partei A') as never);
    const configured = applyEditionQuizConfiguration(generated, {
      version: 1,
      groups: [
        { id: 'quiz-drama' },
        { id: 'quiz-topics', text: { question: 'Überschriebene Frage' } },
        { id: 'quiz-bonus', question: { id: 'quiz-bonus', type: 'prediction', question: 'Bonus?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Testdaten' } },
      ],
    });

    expect(Object.keys(configured)).toEqual(['quiz-drama', 'quiz-topics', 'quiz-bonus']);
    expect(configured['quiz-topics']?.question).toBe('Überschriebene Frage');
    expect(configured['quiz-bonus']?.correctAnswer).toBe('A');
  });

  it('rejects duplicate, unavailable, and contradictory configuration entries', () => {
    const generated = buildEditionQuizModel(fixture('Europa', 'Partei A') as never);
    expect(() => applyEditionQuizConfiguration(generated, { version: 1, groups: [{ id: 'quiz-topics' }, { id: 'quiz-topics' }] })).toThrow('duplicate group ID');
    expect(() => applyEditionQuizConfiguration(generated, { version: 1, groups: [{ id: 'quiz-missing' }] })).toThrow('unavailable group');
    expect(() => applyEditionQuizConfiguration(generated, { version: 1, groups: [{ id: 'quiz-bonus', question: { id: 'quiz-bonus', type: 'prediction', question: 'Bonus?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'Z', explanation: 'Testdaten' } }] })).toThrow('matching correct answer');
  });
});
