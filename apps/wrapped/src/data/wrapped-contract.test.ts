import { describe, expect, it } from 'vitest';
import wrapped from '../../public/wrapped.json';

import { validateContractDocument, validateEditionContent, validateWrappedData } from './wrapped-contract';

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

  it('validates the minimal edition content contract', () => {
    expect(validateEditionContent({ editionId: 'fixture-edition', year: 2042 }, 'content.json')).toEqual({ editionId: 'fixture-edition', year: 2042 });
    expect(() => validateEditionContent({ editionId: 'fixture-edition' }, 'content.json')).toThrow('content.json/');
  });

  it('validates each manifest-referenced runtime asset shape', () => {
    expect(validateContractDocument('SpeakerIndexAsset', {
      speakers: [{ slug: 'fixture-speaker', name: 'Fixture Speaker', party: 'Fixture Party', speeches: 1, wortbeitraege: 0, words: 5 }],
    }, 'speakers/index.json')).toBeDefined();
    expect(validateContractDocument('SpeakerWrappedAsset', {
      name: 'Fixture Speaker', party: 'Fixture Party', slug: 'fixture-speaker', speeches: 1, wortbeitraege: 0,
      totalWords: 5, avgWords: 5, minWords: 5, maxWords: 5, rankings: {}, drama: {}, words: {}, comparison: {}, funFacts: [],
    }, 'speakers/fixture-speaker.json')).toBeDefined();
    expect(validateContractDocument('SpeechesAsset', {
      speeches: [{ speaker: 'Fixture Speaker', party: 'Fixture Party', category: 'rede', words: 5, text: 'Fixture speech.' }],
    }, 'speeches.json')).toBeDefined();
    expect(validateContractDocument('WordsAsset', {
      parties: [{ party: 'Fixture Party', words: [{ word: 'fixture', count: 1 }] }],
    }, 'words.json')).toBeDefined();
    expect(validateContractDocument('WordRankingsAsset', {
      parties: [{ party: 'Fixture Party', signatureWords: [{ word: 'fixture', ratio: 1.5 }] }],
    }, 'word-rankings.json')).toBeDefined();
    expect(validateContractDocument('TopicRankingsAsset', { topics: ['fixture'] }, 'topic-rankings.json')).toBeDefined();
  });

  it('rejects wrong runtime asset fields with an asset path', () => {
    expect(() => validateContractDocument('SpeechesAsset', {
      speeches: [{ speaker: 'Fixture Speaker', party: 'Fixture Party', category: 'rede', words: 'five', text: 'Fixture speech.' }],
    }, 'speeches.json')).toThrow('speeches.json/speeches/0/words');
    expect(() => validateContractDocument('WordsAsset', {
      parties: [{ party: 'Fixture Party', words: [{ word: 'fixture', count: 'one' }] }],
    }, 'words.json')).toThrow('words.json/parties/0/words/0/count');
  });
});
