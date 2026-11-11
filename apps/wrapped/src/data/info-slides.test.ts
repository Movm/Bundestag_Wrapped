import { describe, expect, it } from 'vitest';
import { resolveInfoSlide } from './info-slides';
import { vocabularyIntro } from './intro-slides';

describe('resolveInfoSlide', () => {
  it('names the compared years from the data', () => {
    expect(resolveInfoSlide('info-topic-riser', { year: 2026, baselineYear: '2025' }).body).toContain('Verglichen wird derselbe Zeitraum 2025 und 2026.');
    expect(resolveInfoSlide('info-topic-riser', {}).body).toContain('derselbe Zeitraum des Vorjahres');
  });

  it('spells the number of searched Jugendwörter and mentions earlier years only when counted', () => {
    const body = resolveInfoSlide('info-youth-language', { youthWordCount: 9, hasPastWinners: true }).body;
    expect(body).toContain('nach neun Begriffen');
    expect(body).toContain('früherer Jahre');
    const bare = resolveInfoSlide('info-youth-language', {}).body;
    expect(bare).not.toMatch(/\d|neun/);
    expect(bare).not.toContain('früherer');
  });
});

describe('vocabularyIntro', () => {
  const party = (name: string, word: string) => ({ party: name, signatureWords: [{ word, ratio: 2 }] }) as never;

  it('names a Grüne example word and the quiz group', () => {
    const intro = vocabularyIntro([party('SPD', 'zusammenarbeit'), party('GRÜNE', 'klimakrise')], 'SPD');
    expect(intro.subtitle).toBe('Bei „Klimakrise“ hast du vermutlich eine Vermutung. Aber wie sieht’s bei der SPD aus?');
  });

  it('takes another group’s word when the quiz is about the Grünen', () => {
    const intro = vocabularyIntro([party('GRÜNE', 'klimakrise'), party('AfD', 'landsleute')], 'GRÜNE');
    expect(intro.subtitle).toContain('„Landsleute“');
    expect(intro.subtitle).toContain('bei den Grünen');
  });
});
