import { describe, expect, it } from 'vitest';
import preview2026 from '../../public/data/2026/preview-2026-11-10-match/wrapped.json';
import type { YouthLanguageAnalysis } from '@/generated/wrapped-contract-v1';
import { youthSummary } from './youth-words';

const youth = (preview2026 as unknown as { yearOverYear: { youthLanguage: YouthLanguageAnalysis } }).yearOverYear.youthLanguage;

describe('youthSummary on the 2026 preview data', () => {
  it('names the one Jugendwort that fell, the one old word that survived, and the twist', () => {
    const { body, highlight } = youthSummary(youth, 'older');
    expect(body).toBe('Von neun Jugendwörtern fiel nur eins: „Ragebait“, zweimal, beide Male bei den Grünen. Von den Jugendwörtern seit 2016 hat nur „lost“ (2020) überlebt: viermal im Plenum. Niemand davon gehört zur Gen Z. Die Jungen reden wie Erwachsene, die Erwachsenen wie die Jungen.');
    expect(highlight).toBe('Die Jungen reden wie Erwachsene, die Erwachsenen wie die Jungen.');
  });

  it('says plainly when no Jugendwort fell', () => {
    const none = { ...youth, words: youth.words.map(item => ({ ...item, count: 0 })), byParty: [], pastWinners: [] };
    expect(youthSummary(none, null).body).toBe('Keins der neun Jugendwörter fiel im Plenum.');
  });
});
