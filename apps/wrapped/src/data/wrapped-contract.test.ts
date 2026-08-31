import { describe, expect, it } from 'vitest';
import wrapped from '../../public/wrapped.json';

import { validateContractDocument, validateWrappedData } from './wrapped-contract';

const fixture = {
  schemaVersion: 1,
  editionId: '2026',
  year: 2026,
  title: 'Bundestag Wrapped 2026',
  status: 'preview',
  period: { start: '2026-01-01', end: '2026-12-31', timezone: 'Europe/Berlin', wahlperioden: [21] },
  dataVersion: '2026.1',
  generatedAt: '2027-01-02T08:00:00Z',
  coverage: { protocolCount: 12, firstProtocolDate: '2026-01-08', lastProtocolDate: '2026-12-17', complete: false },
  assets: { wrapped: 'wrapped.json', speakerIndex: 'speakers/index.json', speakersBase: 'speakers/', speeches: 'speeches_db.json', words: 'words_index.json', wordRankings: 'word_rankings.json', topicRankings: 'topic_rankings.json' },
  content: 'content.json',
  checksums: 'checksums.json',
};

describe('Wrapped v1 contract', () => {
  it('accepts the valid manifest fixture', () => {
    expect(validateContractDocument('EditionManifest', fixture, 'manifest.json')).toEqual(fixture);
  });

  it('rejects missing required fields with a filename and JSON path', () => {
    const invalid: Record<string, unknown> = { ...fixture };
    Reflect.deleteProperty(invalid, 'title');
    expect(() => validateContractDocument('EditionManifest', invalid, 'manifest.json')).toThrow(
      'manifest.json/: must have required property',
    );
  });

  it('rejects invalid dates, unknown statuses, and wrong field types', () => {
    expect(() => validateContractDocument('EditionManifest', { ...fixture, status: 'unknown' }, 'manifest.json')).toThrow('status');
    expect(() => validateContractDocument('EditionManifest', { ...fixture, period: { ...fixture.period, start: '2026-99-99' } }, 'manifest.json')).toThrow('start');
    expect(() => validateContractDocument('EditionManifest', { ...fixture, year: '2026' }, 'manifest.json')).toThrow('year');
  });

  it('accepts the checked-in Wrapped production payload', () => {
    expect(validateWrappedData(wrapped, 'wrapped.json')).toEqual(wrapped);
  });
});
