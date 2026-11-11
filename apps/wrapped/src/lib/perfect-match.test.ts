import { describe, expect, it } from 'vitest';
import { scoreMatches, wordPoints, type MatchData } from './perfect-match';

const data: MatchData = {
  schemaVersion: 1,
  parties: ['CDU/CSU', 'SPD', 'GRÜNE', 'DIE LINKE'],
  topics: ['klima', 'wirtschaft', 'soziales'],
  words: [{ word: 'klimaschutz', topic: 'klima' }, { word: 'rente', topic: 'soziales' }],
  animals: [{ id: 'biber', emoji: '🦫', name: 'Biber', count: 2 }, { id: 'biene', emoji: '🐝', name: 'Biene', count: 1 }],
  mps: [
    { slug: 'gruen', name: 'Grün Eins', party: 2, animal: 0, topics: [800, 200, 100], words: [60, 10] },
    { slug: 'spd', name: 'Rot Eins', party: 1, animal: 1, topics: [100, 300, 900], words: [10, 45] },
    { slug: 'cdu', name: 'Schwarz Eins', party: 0, animal: 0, topics: [50, 900, 200], words: [5, 12] },
  ],
};

const answers = { order: ['GRÜNE', 'SPD', 'DIE LINKE', 'CDU/CSU'], topics: ['klima', 'soziales', 'wirtschaft'], words: ['klimaschutz'], animal: 'biber' };

describe('scoreMatches', () => {
  it('ranks the MP that fits every answer first', () => {
    const [first, second] = scoreMatches(data, answers);
    expect(first.slug).toBe('gruen');
    expect(second.slug).toBe('spd');
  });

  it('gives 100 % only to a perfect answer set', () => {
    const perfect: MatchData = { ...data, mps: [{ ...data.mps[0], topics: [900, 900, 900], words: [80, 80] }] };
    expect(scoreMatches(perfect, answers)[0].pct).toBe(100);
  });

  it('explains the match with real numbers', () => {
    const [first] = scoreMatches(data, answers);
    expect(first.reasons).toEqual([
      'GRÜNE ist deine Nr. 1',
      'Spricht viel über Klima & Umwelt',
      'Sagt „klimaschutz“ 6× so oft wie der Bundestag',
      'Teilt dein Spirit Animal: Biber',
    ]);
  });

  it('lets the party ranking move results', () => {
    const [first] = scoreMatches(data, { ...answers, order: ['CDU/CSU', 'SPD', 'GRÜNE', 'DIE LINKE'], topics: ['wirtschaft', 'klima', 'soziales'], words: [], animal: null });
    expect(first.slug).toBe('cdu');
  });

  it('ignores unknown words and topics instead of crashing', () => {
    expect(() => scoreMatches(data, { ...answers, topics: ['raumfahrt'], words: ['nichtda'] })).not.toThrow();
  });
});

describe('wordPoints', () => {
  it('maps the ratio onto a log scale', () => {
    expect(wordPoints(1)).toBe(0);
    expect(wordPoints(0.5)).toBe(0);
    expect(wordPoints(8)).toBe(1);
    expect(wordPoints(20)).toBe(1);
    expect(wordPoints(2)).toBeCloseTo(1 / 3);
  });
});
