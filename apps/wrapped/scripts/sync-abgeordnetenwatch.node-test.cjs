// Run with: node --test scripts/sync-abgeordnetenwatch.node-test.cjs
const assert = require('node:assert/strict');
const test = require('node:test');

const {
  cleanHtmlText,
  getAllPages,
  getPoliticiansByIds,
  getWikidataImageFilename,
  groupByMandate,
  labelProfileImage,
  mapCommonsImage,
  shortPersonKey,
  speakerSlug,
} = require('./sync-abgeordnetenwatch.cjs');

test('speakerSlug matches wrapped slugs across titles and German characters', () => {
  assert.equal(speakerSlug('Dr. Jörg Äcker-Müller'), 'joerg-aecker-mueller');
  assert.equal(speakerSlug('Prof. Dr. Charlotte Neuhäuser'), 'charlotte-neuhaeuser');
  assert.equal(speakerSlug('Cansın Köktürk'), 'cansin-koektuerk');
});

test('shortPersonKey ignores middle names and initials', () => {
  assert.equal(shortPersonKey('Jamila Anna Schäfer'), 'jamila-schaefer');
  assert.equal(shortPersonKey('Philip M. A. Hoffmann'), 'philip-hoffmann');
  assert.equal(shortPersonKey('Dr. Johann David Wadephul'), 'johann-wadephul');
});

test('groupByMandate supports vote and sidejob mandate shapes', () => {
  const grouped = groupByMandate([
    { id: 1, mandate: { id: 10 } },
    { id: 2, mandates: [{ id: 10 }, { id: 11 }] },
  ]);

  assert.deepEqual(grouped.get(10).map((item) => item.id), [1, 2]);
  assert.deepEqual(grouped.get(11).map((item) => item.id), [2]);
});

test('getAllPages fetches every API page and preserves order', async () => {
  const starts = [];
  const getJson = async (_endpoint, params) => {
    starts.push(params.range_start);
    const remaining = Math.max(0, 2500 - params.range_start);
    const count = Math.min(1000, remaining);
    return {
      meta: { result: { total: 2500 } },
      data: Array.from({ length: count }, (_, index) => params.range_start + index),
    };
  };

  const result = await getAllPages(getJson, 'votes');

  assert.deepEqual(starts, [0, 1000, 2000]);
  assert.equal(result.length, 2500);
  assert.equal(result[0], 0);
  assert.equal(result.at(-1), 2499);
});

test('getPoliticiansByIds batches and de-duplicates politician detail requests', async () => {
  const requestedIds = [];
  const getJson = async (_endpoint, params) => {
    const ids = params['id[in]'].slice(1, -1).split(',').map(Number);
    requestedIds.push(ids);
    return { data: ids.map((id) => ({ id, qid_wikidata: `Q${id}` })) };
  };

  const ids = [...Array.from({ length: 51 }, (_, index) => index + 1), 1, undefined];
  const politicians = await getPoliticiansByIds(getJson, ids);

  assert.deepEqual(requestedIds.map((batch) => batch.length), [50, 1]);
  assert.equal(politicians.size, 51);
  assert.equal(politicians.get(51).qid_wikidata, 'Q51');
});

test('getWikidataImageFilename prefers a preferred P18 claim and ignores deprecated claims', () => {
  const entity = {
    claims: {
      P18: [
        { rank: 'normal', mainsnak: { datavalue: { value: 'Normal.jpg' } } },
        { rank: 'preferred', mainsnak: { datavalue: { value: 'Preferred.jpg' } } },
      ],
    },
  };

  assert.equal(getWikidataImageFilename(entity), 'Preferred.jpg');
  assert.equal(getWikidataImageFilename({ claims: { P18: [{ rank: 'deprecated' }] } }), null);
});

test('mapCommonsImage creates generic, attributed image metadata', () => {
  const page = {
    imageinfo: [{
      url: 'https://upload.wikimedia.org/example.jpg?utm_source=commons',
      thumburl: 'https://upload.wikimedia.org/example-thumb.jpg?utm_content=thumbnail',
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      extmetadata: {
        Artist: { value: '<bdi>Erika &amp; Max Mustermann</bdi>' },
        LicenseShortName: { value: 'CC BY-SA 4.0' },
        LicenseUrl: { value: 'http://creativecommons.org/licenses/by-sa/4.0' },
        AttributionRequired: { value: 'true' },
        DateTimeOriginal: { value: '2026-01-02' },
      },
    }],
  };

  const image = labelProfileImage(mapCommonsImage(page), 'Erika Beispiel');

  assert.equal(image.url, 'https://upload.wikimedia.org/example.jpg');
  assert.equal(image.photographer, 'Erika & Max Mustermann');
  assert.equal(image.alt, 'Porträt von Erika Beispiel.');
  assert.equal(image.license, 'CC BY-SA 4.0');
  assert.equal(image.licenseUrl, 'https://creativecommons.org/licenses/by-sa/4.0');
  assert.match(image.usageNotice, /Namensnennung/);
  assert.equal(cleanHtmlText('<span>Ein&nbsp;Name</span>'), 'Ein Name');
});
