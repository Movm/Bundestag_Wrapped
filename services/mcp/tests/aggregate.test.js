import { describe, it, expect } from 'vitest';
import { monthBuckets, yearBuckets, buildDigest, countTool, vorgangTimelineTool } from '../src/tools/aggregate.js';

describe('time bucketing', () => {
  it('builds inclusive month buckets across a year boundary', () => {
    const buckets = monthBuckets('2025-11-15', '2026-02-03');
    expect(buckets.map(b => b.label)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    // Window edges cover the whole month, independent of the input day.
    expect(buckets[0].start).toBe('2025-11-01');
    expect(buckets[0].end).toBe('2025-11-30');
    expect(buckets[2].end).toBe('2026-01-31');
  });

  it('handles February month length', () => {
    const buckets = monthBuckets('2024-02-10', '2024-02-10');
    expect(buckets).toHaveLength(1);
    expect(buckets[0].end).toBe('2024-02-29'); // leap year
  });

  it('builds inclusive year buckets', () => {
    const buckets = yearBuckets('2023-06-01', '2026-01-01');
    expect(buckets.map(b => b.label)).toEqual(['2023', '2024', '2025', '2026']);
    expect(buckets[0]).toMatchObject({ start: '2023-01-01', end: '2023-12-31' });
  });
});

describe('bundestag_count validation', () => {
  it('requires a date range for time-series grouping', async () => {
    const res = await countTool.handler({ entity: 'vorgang', groupBy: 'month' });
    expect(res.error).toBe(true);
    expect(res.message).toMatch(/datum_start/);
  });

  it('rejects a group field that does not apply to the entity', async () => {
    const res = await countTool.handler({ entity: 'vorgang', groupBy: 'drucksachetyp' });
    expect(res.error).toBe(true);
    expect(res.message).toMatch(/only applies to entity "drucksache"/);
  });

  it('requires explicit values for the open-ended initiative grouping', async () => {
    const res = await countTool.handler({ entity: 'vorgang', groupBy: 'initiative' });
    expect(res.error).toBe(true);
    expect(res.message).toMatch(/groupValues/);
  });
});

describe('bundestag_vorgang_timeline shape', () => {
  it('exposes the documented handler surface', () => {
    expect(vorgangTimelineTool.name).toBe('bundestag_vorgang_timeline');
    expect(vorgangTimelineTool.inputSchema).toHaveProperty('vorgang_id');
    expect(typeof vorgangTimelineTool.handler).toBe('function');
  });
});

// Fixture mirrors the real DIP shape for Vorgang 334564 (Düngegesetz), trimmed to
// the fields buildDigest reads. Guards the extraction without hitting the network.
describe('buildDigest extraction (real DIP shape)', () => {
  const vorgang = {
    id: '334564',
    titel: 'Zweites Gesetz zur Änderung des Düngegesetzes',
    vorgangstyp: 'Gesetzgebung',
    beratungsstand: 'Überwiesen',
    initiative: ['Bundesregierung']
  };
  const positions = [
    {
      vorgangsposition: 'Gesetzentwurf', zuordnung: 'BR', datum: '2026-05-01',
      ueberweisung: [
        { ausschuss: 'Ausschuss für Agrarpolitik und Verbraucherschutz', ausschuss_kuerzel: 'AV', federfuehrung: true }
      ],
      fundstelle: { dokumentnummer: '251/26', drucksachetyp: 'Gesetzentwurf', dokumentart: 'Drucksache', pdf_url: 'https://dserver.bundestag.de/brd/2026/0251-26.pdf' }
    },
    {
      vorgangsposition: '1. Beratung', zuordnung: 'BT', datum: '2026-06-11',
      beschlussfassung: [{ beschlusstenor: 'Überweisung', dokumentnummer: '21/6135', seite: '10150C' }],
      aktivitaet_anzeige: [
        { aktivitaetsart: 'Rede', titel: 'Karl Bär, MdB, BÜNDNIS 90/DIE GRÜNEN', seite: '10149C', pdf_url: 'https://dserver.bundestag.de/btp/21/21083.pdf#P.10149' }
      ],
      fundstelle: { dokumentnummer: '21/83', dokumentart: 'Plenarprotokoll' }
    }
  ];

  const digest = buildDigest(vorgang, positions);

  it('carries the proceeding header through', () => {
    expect(digest.vorgang).toMatchObject({ id: '334564', vorgangstyp: 'Gesetzgebung', beratungsstand: 'Überwiesen' });
  });

  it('extracts the federführend committee flag', () => {
    const av = digest.committees.find(c => c.kuerzel === 'AV');
    expect(av.federfuehrend).toBe(true);
  });

  it('extracts the collective decision tenor with its page anchor', () => {
    expect(digest.decisions).toHaveLength(1);
    expect(digest.decisions[0]).toMatchObject({ tenor: 'Überweisung', seite: '10150C', chamber: 'BT' });
  });

  it('extracts speakers with party and PDF anchor', () => {
    expect(digest.speakers[0].titel).toMatch(/GRÜNEN/);
    expect(digest.speakers[0].pdf_url).toMatch(/#P\.10149$/);
  });

  it('sorts steps chronologically and dedupes documents', () => {
    expect(digest.steps.map(s => s.datum)).toEqual(['2026-05-01', '2026-06-11']);
    expect(digest.counts.documents).toBe(2);
  });
});
