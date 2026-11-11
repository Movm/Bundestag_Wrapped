import { describe, expect, it } from 'vitest';
import { againstChamber, areaName, chancellorVerdict, lastName, shareOptions, split, timesAs } from './chancellor';

describe('chancellor wording', () => {
  it('rounds the split to whole percent that add up to 100', () => {
    expect(split(44.3)).toEqual({ foreign: 44, domestic: 56 });
    expect(split(49.5)).toEqual({ foreign: 50, domestic: 50 });
  });

  it('calls a split within ten points of half close', () => {
    expect(chancellorVerdict(44.3)).toEqual({ side: 'innen', close: true });
    expect(chancellorVerdict(38)).toEqual({ side: 'innen', close: false });
    expect(chancellorVerdict(61)).toEqual({ side: 'aussen', close: false });
    expect(chancellorVerdict(50.2)).toEqual({ side: 'beides', close: true });
  });

  it('offers the real share and three distinct others between 1 and 99 %', () => {
    expect(shareOptions(44.3)).toEqual(['44 %', '30 %', '58 %', '16 %']);
    expect(shareOptions(8)).toEqual(['8 %', '22 %', '36 %', '50 %']);
    expect(shareOptions(95)).toEqual(['95 %', '81 %', '67 %', '53 %']);
  });

  it('compares an area per 1,000 words with the rest of the chamber', () => {
    const area = { id: 'europa', side: 'aussen' as const, count: 1, chamberPerThousand: 5 };
    expect(againstChamber({ ...area, perThousand: 15 })).toBe('rund dreimal so oft wie im restlichen Bundestag');
    expect(againstChamber({ ...area, perThousand: 7.5 })).toBe('1,5-mal so oft wie im restlichen Bundestag');
    expect(againstChamber({ ...area, perThousand: 5.2 })).toBe('etwa so oft wie im restlichen Bundestag');
    expect(againstChamber({ ...area, perThousand: 3 })).toBe('seltener als im restlichen Bundestag');
    expect(timesAs(2.77)).toBe('2,8-mal so');
  });

  it('names the areas the pipeline splits out and the speaker', () => {
    expect(areaName('verteidigung')).toBe('Verteidigung');
    expect(areaName('aussenhandel')).toBe('Außenhandel');
    expect(areaName('europa')).toBe('Europa/Außen');
    expect(lastName('Friedrich Merz')).toBe('Merz');
  });
});
