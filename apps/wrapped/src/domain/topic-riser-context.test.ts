import { describe, expect, it } from 'vitest';
import type { TopicAnalysis, YearOverYearAnalysis } from '@/generated/wrapped-contract-v1';
import { pickRiserOptions } from './edition-quiz';
import { buildTopicRiserContext } from './topic-riser-context';

const analysis = {
  baseline: { editionId: '2025', start: '2025-01-01', end: '2025-11-10' },
  topics: [
    { label: 'europa', currentRank: 2, previousRank: 3, rankChange: 1 },
    { label: 'wirtschaft', currentRank: 1, previousRank: 2, rankChange: 1 },
    { label: 'soziales', currentRank: 3, previousRank: 4, rankChange: 1 },
    { label: 'klima', currentRank: 6, previousRank: 6, rankChange: 0 },
    { label: 'finanzen', currentRank: 4, previousRank: 1, rankChange: -3 },
  ],
  words: [],
  signatureWords: [
    { party: 'CDU/CSU', risers: [
      { word: 'mitte', currentRank: 3, previousRank: null },
      { word: 'wachstum', currentRank: 1, previousRank: null },
      { word: 'landsleute', currentRank: 2, previousRank: 4 },
    ], fallers: [] },
  ],
  youthLanguage: { lexiconVersion: 'x', words: [], byParty: [], bySpeaker: [] },
} as unknown as YearOverYearAnalysis;

const topics = {
  overall: { wirtschaft: 5 },
  topWords: { wirtschaft: [{ word: 'wachstum', count: 9 }, { word: 'bip', count: 4 }] },
  topSpeakers: { wirtschaft: [
    { name: 'A', party: 'SPD', vsAverage: 3.1 }, { name: 'B', party: 'CDU/CSU', vsAverage: 2.4 },
    { name: 'C', party: 'AfD', vsAverage: 2 }, { name: 'D', party: 'SPD', vsAverage: 1.9 },
  ] },
  byParty: {
    SPD: { wirtschaft: 4 },
    'CDU/CSU': { wirtschaft: 6 },
    fraktionslos: { wirtschaft: 9 },
  },
  topTopics: [],
} as unknown as TopicAnalysis;

describe('topic riser context', () => {
  it('explains the same topic the quiz marks as correct', () => {
    const context = buildTopicRiserContext(analysis, topics);
    expect(context?.riser.label).toBe('wirtschaft');
    // The quiz's correct answer comes from the same picker (ties → better current rank).
    expect(pickRiserOptions(analysis.topics)?.winner.label).toBe(context?.riser.label);
  });

  it('lists the words behind the topic and ranks groups against the average', () => {
    const context = buildTopicRiserContext(analysis, topics);
    expect(context?.words).toEqual(['Wachstum', 'BIP']);
    expect(context?.speakers.map(item => item.name)).toEqual(['A', 'B', 'C']);
    expect(context?.parties).toEqual([
      { party: 'CDU/CSU', vsAverage: 1.2 },
      { party: 'SPD', vsAverage: 0.8 },
    ]);
  });

  it('is empty when nothing moved up', () => {
    const flat = { ...analysis, topics: analysis.topics.map(item => ({ ...item, rankChange: 0 })) };
    expect(buildTopicRiserContext(flat, topics)).toBeNull();
  });

  it('degrades without topic scores', () => {
    const context = buildTopicRiserContext(analysis, null);
    expect(context?.parties).toEqual([]);
    expect(context?.words).toEqual([]);
  });
});
