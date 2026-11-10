import { describe, expect, it } from 'vitest';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { buildMdbQuiz, estimateIsCorrect, estimateMax, estimateVerdict, finalLine, firstName } from './mdb-quiz';

function speaker(words: Partial<SpeakerWrapped['words']>, extra: Partial<SpeakerWrapped> = {}): SpeakerWrapped {
  return {
    name: 'Lukas Benner', academicTitle: null, party: 'GRÜNE', slug: 'lukas-benner',
    words: {
      topWords: ['menschen', 'zukunft', 'bundesregierung', 'lage', 'vertreibung', 'europa'].map((word, i) => ({ word, count: 10 - i })),
      ...words,
    },
    signatureQuiz: null,
    ...extra,
  } as SpeakerWrapped;
}

const bt = (word: string, ratio: number) => ({ word, count: 5, ratio });

describe('buildMdbQuiz', () => {
  it('builds every round from the exported ratios and never offers a signature word as a wrong answer', () => {
    const quiz = buildMdbQuiz(speaker({
      signatureWordsBundestag: [bt('vertreibung', 10.2), bt('asylverfahren', 7.4)],
      signatureWordsParty: [bt('vertreibung', 6.3), bt('asylverfahren', 4.8)],
    }))!;
    expect(quiz.rounds.map(round => round.id)).toEqual(['bundestag-pick', 'bundestag-estimate', 'party-pick', 'faction-direction']);
    const [pick, estimate, party, direction] = quiz.rounds;
    expect(pick.kind === 'pick' && pick.options.find(option => option.isCorrect)?.text).toBe('vertreibung');
    expect(pick.kind === 'pick' && pick.options.map(option => option.text).sort()).toEqual(['bundesregierung', 'menschen', 'vertreibung', 'zukunft']);
    expect(estimate).toMatchObject({ kind: 'estimate', answer: 10.2, max: 20 });
    // The party round asks for a different word than the first round.
    expect(party.kind === 'pick' && party.options.find(option => option.isCorrect)?.text).toBe('asylverfahren');
    // 10.2 / 6.3 ≈ 1.6: the faction says it more often than the Bundestag.
    expect(direction.kind === 'pick' && direction.options.find(option => option.isCorrect)?.text).toBe('Häufiger');
  });

  it('answers "Seltener" when the faction says the word less often than the Bundestag', () => {
    const quiz = buildMdbQuiz(speaker({ signatureWordsBundestag: [bt('wolf', 3)], signatureWordsParty: [bt('wolf', 6)] }))!;
    const direction = quiz.rounds.find(round => round.id === 'faction-direction')!;
    expect(direction.kind === 'pick' && direction.options.find(option => option.isCorrect)?.text).toBe('Seltener');
  });

  it('leaves out rounds without data and drops a quiz with fewer than two rounds', () => {
    // One word in both lists: no distinct party word, so no party pick.
    const quiz = buildMdbQuiz(speaker({ signatureWordsBundestag: [bt('vertreibung', 10.2)], signatureWordsParty: [bt('vertreibung', 6.3)] }))!;
    expect(quiz.rounds.map(round => round.id)).toEqual(['bundestag-pick', 'bundestag-estimate', 'faction-direction']);
    expect(buildMdbQuiz(speaker({ signatureWordsParty: [bt('vertreibung', 6.3)] }))).toBeNull();
    expect(buildMdbQuiz(speaker({}))).toBeNull();
  });

  it('keeps the option order stable for the same MP', () => {
    const words = { signatureWordsBundestag: [bt('vertreibung', 10.2)], signatureWordsParty: [bt('asyl', 4)] };
    expect(buildMdbQuiz(speaker(words))).toEqual(buildMdbQuiz(speaker(words)));
  });
});

describe('estimate', () => {
  it('grows the slider with the answer and accepts a quarter off', () => {
    expect(estimateMax(10.2)).toBe(20);
    expect(estimateMax(31)).toBe(50);
    expect(estimateIsCorrect(8, 10.2)).toBe(true);
    expect(estimateIsCorrect(7.5, 10.2)).toBe(false);
    expect(estimateVerdict(6, 10.2)).toBe('Fast!');
    expect(estimateVerdict(1, 10.2)).toBe('Daneben.');
  });
});

describe('names', () => {
  it('drops the academic title and uses the right genitive', () => {
    expect(firstName({ name: 'Dr. Anna Lührmann', academicTitle: 'Dr.' })).toBe('Anna');
    expect(finalLine(3, 3, 'Lukas')).toBe('Du könntest Lukas’ Reden schreiben.');
    expect(finalLine(3, 3, 'Anna')).toBe('Du könntest Annas Reden schreiben.');
    expect(finalLine(0, 3, 'Anna')).toBe('Wer ist Anna?');
  });
});
