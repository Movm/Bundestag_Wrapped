import { describe, expect, it } from 'vitest';
import { applyEditionQuizConfiguration, buildEditionQuizModel, pickRiserOptions } from './edition-quiz';
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

  it('asks the signature quiz about the party an edition pins', () => {
    const data = fixture('Europa', 'AfD');
    data.parties.push({ party: 'SPD', signatureWords: [{ word: 'bafög', ratio: 1.3 }, { word: 'Zwei', ratio: 1.2 }, { word: 'Drei', ratio: 1.1 }, { word: 'Vier', ratio: 1.05 }] });

    expect(buildEditionQuizModel(data as never)['quiz-signature']?.question).toContain('AfD');
    const pinned = buildEditionQuizModel(data as never, { version: 1, groups: [{ id: 'quiz-signature', party: 'SPD' }] })['quiz-signature'];
    expect(pinned?.question).toContain('SPD');
    expect(pinned?.correctAnswer).toBe('bafög');
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
          { label: 'dank', currentRank: 2, previousRank: 3, rankChange: 1 },
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

describe('riser ties', () => {
  const words = [
    { label: 'kind', currentRank: 6, previousRank: 13, rankChange: 7 },
    { label: 'staat', currentRank: 7, previousRank: 14, rankChange: 7 },
    { label: 'mensch', currentRank: 1, previousRank: 3, rankChange: 2 },
    { label: 'land', currentRank: 3, previousRank: 1, rankChange: -2 },
    { label: 'weg', currentRank: 11, previousRank: 5, rankChange: -6 },
  ];

  it('breaks a tie by the better current rank and never offers the tied entry', () => {
    // Input order must not matter.
    for (const items of [words, [...words].reverse()]) {
      const picked = pickRiserOptions(items);
      expect(picked?.winner.label).toBe('kind');
      expect(picked?.options).not.toContain('staat');
      expect(new Set(picked?.options)).toEqual(new Set(['kind', 'mensch', 'land', 'weg']));
    }
  });

  it('omits the question when too few untied options remain', () => {
    const data = {
      ...fixture('Europa', 'Partei A'),
      yearOverYear: {
        baseline: { editionId: '2025', start: '2025-01-01', end: '2025-12-31' },
        topics: [
          { label: 'A', currentRank: 1, previousRank: 2, rankChange: 1 },
          { label: 'B', currentRank: 2, previousRank: 3, rankChange: 1 },
          { label: 'C', currentRank: 3, previousRank: 4, rankChange: 1 },
          { label: 'D', currentRank: 4, previousRank: 4, rankChange: 0 },
        ],
        words: [],
        youthLanguage: { lexiconVersion: 'x', words: [], byParty: [] },
      },
    };
    expect(buildEditionQuizModel(data as never)['quiz-topic-riser']).toBeUndefined();
  });
});

describe('Jugendwort question', () => {
  const withYouth = (words: Array<{ word: string; count: number; winnerYear?: number }>) => ({
    ...fixture('Europa', 'Partei A'),
    yearOverYear: {
      baseline: { editionId: '2025', start: '2025-01-01', end: '2025-12-31' },
      topics: [], words: [],
      youthLanguage: {
        lexiconVersion: 'x',
        words: words.map(item => ({ previousCount: 0, change: item.count, ...item })),
        byParty: [{ party: 'Partei A', count: 9 }], bySpeaker: [],
      },
    },
  });

  it('asks for the winner flagged by the lexicon with numeric options around its count', () => {
    const model = buildEditionQuizModel(withYouth([
      { word: 'macher', count: 8 }, { word: 'ragebait', count: 1, winnerYear: 2026 },
    ]) as never);
    const quiz = model['quiz-youth-language'];
    expect(quiz?.question).toBe('Wie oft fiel das Jugendwort 2026 „ragebait“ bisher im Bundestag?');
    expect(quiz?.correctAnswer).toBe('1');
    expect(quiz?.options).toEqual(['1', '3', '5', '0']);
    expect(quiz?.explanation).toContain('1 kontextuell bestätigte Treffer');
    expect(quiz?.explanation).toContain('Wut provozieren');
  });

  it('follows the count and keeps options distinct', () => {
    const quiz = buildEditionQuizModel(withYouth([{ word: 'ragebait', count: 12, winnerYear: 2026 }]) as never)['quiz-youth-language'];
    expect(quiz?.options).toEqual(['12', '14', '16', '10']);
  });

  it('is omitted without hits for the winner', () => {
    const model = buildEditionQuizModel(withYouth([{ word: 'macher', count: 8 }, { word: 'ragebait', count: 0, winnerYear: 2026 }]) as never);
    expect(model['quiz-youth-language']).toBeUndefined();
  });
});

describe('Jugendwort speaker question', () => {
  type Sayer = { name: string; party: string; count: number };
  // Mirrors the 2026 preview: two GRÜNE speakers said "ragebait" once each.
  const sayers: Sayer[] = [
    { name: 'Marcel Emmerich', party: 'GRÜNE', count: 1 },
    { name: 'Awet Tesfaiesus', party: 'GRÜNE', count: 1 },
  ];
  const others: Sayer[] = [
    { name: 'Beatrix von Storch', party: 'AfD', count: 2 },
    { name: 'Christian Zaum', party: 'AfD', count: 2 },
    { name: 'Mandy Eißing', party: 'DIE LINKE', count: 2 },
    { name: 'Caroline Bosbach', party: 'CDU/CSU', count: 1 },
  ];
  const build = (speakers: Sayer[] | undefined, bySpeaker: Sayer[], count = speakers?.reduce((sum, item) => sum + item.count, 0) ?? 2) => ({
    ...fixture('Europa', 'Partei A'),
    yearOverYear: {
      baseline: { editionId: '2025', start: '2025-01-01', end: '2025-12-31' },
      topics: [], words: [],
      youthLanguage: {
        lexiconVersion: 'x',
        words: [{ word: 'ragebait', count, previousCount: 0, change: count, winnerYear: 2026, ...(speakers ? { speakers } : {}) }],
        byParty: [], bySpeaker,
      },
    },
  });
  const quizOf = (data: unknown) => buildEditionQuizModel(data as never)['quiz-youth-language'];

  const withGenz = (names: string[]) => (data: object) => ({
    ...data,
    generations: { bornFrom: 1997, cohort: 'genz', speakerCount: names.length, totalSpeakers: 500, unknownSpeakers: 0, speechesPerSpeaker: 1, olderSpeechesPerSpeaker: 1, parties: [], words: [], fewerWords: [], speakers: names.map(name => ({ name, party: 'GRÜNE', birthYear: 1999, speeches: 1 })) },
  });

  it('asks which generation said the word when Gen Z MPs are known', () => {
    const quiz = quizOf(withGenz(['Luke Hoß'])(build(sayers, sayers)));
    expect(quiz?.options).toEqual(['Die Gen Z', 'Die Älteren', 'Beide', 'Niemand']);
    expect(quiz?.correctAnswer).toBe('Die Älteren');
    expect(quiz?.explanation).toBe('Gesagt haben es Marcel Emmerich (GRÜNE) und Awet Tesfaiesus (GRÜNE). Niemand davon gehört zur Gen Z.');
  });

  it('counts a titled name as the same Gen Z person', () => {
    const quiz = quizOf(withGenz(['Marcel Emmerich', 'Awet Tesfaiesus'])(build([{ name: 'Dr. Marcel Emmerich', party: 'GRÜNE', count: 1 }, { name: 'Zoe', party: 'SPD', count: 1 }], [])));
    expect(quiz?.correctAnswer).toBe('Beide');
  });

  it('asks who said the word, excludes the other sayer and mentions them', () => {
    const quiz = quizOf(build(sayers, [...sayers, ...others]));
    expect(quiz?.question).toBe('Das Jugendwort 2026 heißt „ragebait“. Wer hat es im Bundestag gesagt?');
    // tie: alphabetically first name is the answer, the other sayer is not offered
    expect(quiz?.correctAnswer).toBe('Marcel Emmerich (GRÜNE)');
    expect(quiz?.options).toEqual(['Marcel Emmerich (GRÜNE)', 'Beatrix von Storch (AfD)', 'Mandy Eißing (DIE LINKE)', 'Caroline Bosbach (CDU/CSU)']);
    expect(quiz?.options.join()).not.toContain('Tesfaiesus');
    expect(quiz?.explanation).toContain('Marcel Emmerich (GRÜNE) sagte „ragebait“ einmal.');
    expect(quiz?.explanation).toContain('Awet Tesfaiesus (GRÜNE, einmal)');
    expect(quiz?.explanation).toContain('Wut provozieren');
  });

  it('uses the most frequent speaker as the answer for a single sayer', () => {
    const quiz = quizOf(build([{ name: 'Awet Tesfaiesus', party: 'GRÜNE', count: 3 }], others));
    expect(quiz?.correctAnswer).toBe('Awet Tesfaiesus (GRÜNE)');
    expect(quiz?.explanation).toContain('3-mal');
    expect(quiz?.explanation).not.toContain('Auch gesagt');
  });

  it('prefers distractors from different parties', () => {
    const quiz = quizOf(build([sayers[0]!], others));
    expect(quiz?.options.slice(1)).toEqual(['Beatrix von Storch (AfD)', 'Mandy Eißing (DIE LINKE)', 'Caroline Bosbach (CDU/CSU)']);
  });

  it('is omitted when fewer than four options can be built', () => {
    // no prominent-speaker fallback either
    expect(quizOf({ ...build([sayers[0]!], others.slice(0, 2)), topSpeakersByWords: [] })).toBeUndefined();
  });

  it('is omitted without hits', () => {
    expect(quizOf(build([], others, 0))).toBeUndefined();
  });

  it('falls back to the count question when the edition has no speaker data', () => {
    const quiz = quizOf(build(undefined, others, 2));
    expect(quiz?.question).toBe('Wie oft fiel das Jugendwort 2026 „ragebait“ bisher im Bundestag?');
  });
});

describe('edition quiz configuration', () => {
  it('runs the 2026 edition as topic riser, signature words, youth language, the moment of the year and Gen Z', () => {
    expect(quiz2026.groups.map(group => group.id)).toEqual(['quiz-topic-riser', 'quiz-signature', 'quiz-youth-language', 'quiz-mention', 'quiz-genz']);
  });

  it('asks which group has the most Gen Z MPs only with a clear leader', () => {
    const parties = [{ party: 'DIE LINKE', count: 10 }, { party: 'AfD', count: 3 }, { party: 'GRÜNE', count: 3 }, { party: 'SPD', count: 2 }, { party: 'CDU/CSU', count: 1 }];
    const quizOf = (list: typeof parties) => buildEditionQuizModel({ ...fixture('Europa', 'A'), generations: { speakerCount: 19, parties: list } } as never)['quiz-genz'];
    const quiz = quizOf(parties);
    expect(quiz?.correctAnswer).toBe('DIE LINKE');
    expect(quiz?.options).toHaveLength(4);
    expect(quizOf([{ party: 'A', count: 3 }, { party: 'B', count: 3 }, { party: 'C', count: 1 }, { party: 'D', count: 1 }])).toBeUndefined();
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

  it('asks who talked most about the moment of the year, only with a clear leader', () => {
    const speakers = [
      { name: 'Zoe', party: 'GRÜNE', count: 2, date: '2026-04-15', quote: 'q' },
      { name: 'Daniel', party: 'SPD', count: 1, date: '2026-05-21', quote: 'q' },
      { name: 'Fabian', party: 'DIE LINKE', count: 1, date: '2026-04-24', quote: 'q' },
      { name: 'Vanessa', party: 'CDU/CSU', count: 1, date: '2026-04-23', quote: 'q' },
    ];
    const base = fixture('Europa', 'Partei A') as WrappedData;
    const quiz = buildEditionQuizModel({ ...base, mentions: [{ id: 'timmy', label: 'Timmy der Wal', count: 5, speakers }] })['quiz-mention'];
    expect(quiz?.question).toBe('Wer hat „Timmy der Wal“ im Plenum am häufigsten erwähnt?');
    expect(quiz?.correctAnswer).toBe('Zoe (GRÜNE)');
    expect(quiz?.options).toHaveLength(4);
    const tie = speakers.map(speaker => ({ ...speaker, count: 1 }));
    expect(buildEditionQuizModel({ ...base, mentions: [{ id: 'timmy', label: 'Timmy', count: 4, speakers: tie }] })['quiz-mention']).toBeUndefined();
  });
});
