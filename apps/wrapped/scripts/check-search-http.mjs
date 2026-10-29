/** Smoke-test actual nginx transport, including gzip/ranges and preview auth. */
import assert from 'node:assert/strict';
import { parseStaticSpeechIndex } from '../src/lib/speech-index-model.ts';
import { decodePostings, gramFilename, SPEECH_INDEX_VERSION } from '../src/lib/speech-index-format.ts';
import { parseByteParts, textFromParts } from '../src/lib/speech-text-ranges.ts';
const origin = (process.argv[2] || 'http://127.0.0.1:4179').replace(/\/$/, '');
async function get(resource, headers = {}) {
  return fetch(`${origin}${resource}`, { headers: { 'Accept-Encoding': 'gzip', ...headers }, redirect: 'error', signal: AbortSignal.timeout(15000) });
}
async function json(resource) {
  const response = await get(resource);
  assert.equal(response.status, 200, resource);
  return response.json();
}
const registry = await json('/data/editions.json');
const summary = registry.editions.find(edition => edition.id === registry.currentEdition);
const manifest = await json(summary.manifestUrl);
const versionBase = summary.manifestUrl.slice(0, summary.manifestUrl.lastIndexOf('/'));
const checksums = await json(`${versionBase}/${manifest.checksums}`);
const identity = { editionId: manifest.editionId, dataVersion: manifest.dataVersion, manifestSha256: checksums['manifest.json'].toLowerCase(), sourceSha256: checksums[manifest.assets.speeches].toLowerCase() };
const parent = summary.manifestUrl.split('/').slice(0, -2).join('/');
const base = `${parent}/search-v${SPEECH_INDEX_VERSION}-${identity.manifestSha256}-${identity.sourceSha256}`;
const metadata = await get(`${base}/index.json`);
assert.equal(metadata.status, 200);
assert.equal(metadata.headers.get('content-encoding'), 'gzip');
assert.match(metadata.headers.get('cache-control') || '', /immutable/);
const index = parseStaticSpeechIndex(await metadata.json(), identity);
const [gram, count] = [...index.counts].find(([gram, count]) => gram.length === 3 && count > 100);
const postingResponse = await get(`${base}/grams/${gramFilename(gram)}`);
assert.equal(postingResponse.status, 200);
assert.equal(postingResponse.headers.get('content-encoding'), 'gzip');
const posting = decodePostings(await postingResponse.arrayBuffer(), index.end - 1);
assert.equal(posting.positions.length, count);
const total = index.textLength * 2;
assert(total >= 8);
const response = await get(`${base}/texts.bin`, { Range: `bytes=0-3,${total - 4}-${total - 1}` });
if (response.status !== 206 || response.headers.get('content-encoding') || Number(response.headers.get('content-length')) > 5000) {
  await response.body?.cancel();
  throw new Error('nginx did not serve bounded, identity-encoded ranges');
}
const bytes = new Uint8Array(await response.arrayBuffer());
assert(bytes.length < 5000);
const parts = parseByteParts(bytes, response.headers.get('content-type') || '', response.headers.get('content-range'), total);
assert.equal(textFromParts(parts, 0, 2).length, 2);
assert.equal(textFromParts(parts, index.textLength - 2, 2).length, 2);
const privateBase = `/data/2026/search-v${SPEECH_INDEX_VERSION}-${'a'.repeat(64)}-${'b'.repeat(64)}`;
for (const asset of ['index.json', 'texts.bin', 'grams/006100620063.bin', 'details/0.json']) {
  const denied = await get(`${privateBase}/${asset}`, { Range: 'bytes=0-3' });
  assert.equal(denied.status, 401, asset);
  assert.match(denied.headers.get('cache-control') || '', /private/);
  assert.match(denied.headers.get('cache-control') || '', /no-store/);
  assert(!denied.headers.get('cache-control')?.includes('public'));
  await denied.body?.cancel();
}
console.log(JSON.stringify({ editionId: manifest.editionId, speeches: index.entries.length, metadataEncoding: 'gzip', postingEncoding: 'gzip', sourceBytes: total, rangeResponseBytes: bytes.length, rangeStatus: 206, protectedPreview: 'passed' }, null, 2));
