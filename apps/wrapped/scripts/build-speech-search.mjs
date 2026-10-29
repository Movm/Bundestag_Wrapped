/** Generate disposable search sidecars; frozen edition files stay byte-identical. */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { encodePostings, gramFilename, SPEECH_INDEX_VERSION } from '../src/lib/speech-index-format.ts';

const schema = JSON.parse(readFileSync(new URL('../src/generated/wrapped-contract-v1.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv); ajv.addSchema(schema);
function validate(document, value) {
  const check = ajv.getSchema(`${schema.$id}#/$defs/${document}`);
  if (!check || !check(value)) throw new Error(`Invalid search source ${document}: ${ajv.errorsText(check?.errors)}`);
}
const hash = value => createHash('sha256').update(value).digest('hex');
function write(file, data, compressed = false) {
  writeFileSync(file, data);
  if (compressed) writeFileSync(`${file}.gz`, gzipSync(data));
}
function dictionary() {
  const values = [], ids = new Map();
  return { values, id(value) { if (!ids.has(value)) { ids.set(value, values.length); values.push(value); } return ids.get(value); } };
}
function relative(base, asset) {
  if (typeof asset !== 'string' || !/^(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.json$/.test(asset)) throw new Error('Invalid edition asset path');
  return path.join(base, asset);
}
export function buildSpeechSearch(dataRoot) {
  dataRoot = path.resolve(dataRoot);
  if (dataRoot === path.resolve(fileURLToPath(new URL('../public/data', import.meta.url)))) throw new Error('Generate search sidecars in dist, not frozen public data');
  const registry = JSON.parse(readFileSync(path.join(dataRoot, 'editions.json'), 'utf8'));
  validate('EditionsIndex', registry);
  const reports = [];
  for (const edition of registry.editions) {
    if (!/^\/data\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/manifest\.json$/.test(edition.manifestUrl)) throw new Error('Invalid edition manifest path');
    const manifestFile = path.join(dataRoot, edition.manifestUrl.slice('/data/'.length));
    const base = path.dirname(manifestFile);
    const manifestBytes = readFileSync(manifestFile);
    const manifest = JSON.parse(manifestBytes);
    validate('EditionManifest', manifest);
    const checksums = JSON.parse(readFileSync(relative(base, manifest.checksums), 'utf8'));
    const sourceBytes = readFileSync(relative(base, manifest.assets.speeches));
    const sourceSha256 = hash(sourceBytes), manifestSha256 = hash(manifestBytes);
    if (typeof checksums[manifest.assets.speeches] !== 'string' || checksums[manifest.assets.speeches].toLowerCase() !== sourceSha256 || typeof checksums['manifest.json'] !== 'string' || checksums['manifest.json'].toLowerCase() !== manifestSha256) throw new Error('Search source checksum mismatch');
    if (manifest.editionId !== edition.id) throw new Error('Search edition mismatch');
    const source = JSON.parse(sourceBytes);
    validate('SpeechesAsset', source);
    const speeches = source.speeches;
    const directory = `search-v${SPEECH_INDEX_VERSION}-${manifestSha256}-${sourceSha256}`;
    const output = path.join(path.dirname(base), directory);
    for (const folder of ['grams', 'details']) mkdirSync(path.join(output, folder), { recursive: true });
    const speakers = dictionary(), parties = dictionary(), types = dictionary();
    const rows = [], grams = new Map();
    let offset = 0;
    for (const [id, speech] of speeches.entries()) {
      const lower = speech.text.toLowerCase();
      if (offset + lower.length >= 2 ** 30) throw new Error('Search corpus exceeds format capacity');
      rows.push([speakers.id(speech.speaker), parties.id(speech.party), types.id(speech.type ?? ''), speech.category === 'rede' ? 0 : 1, speech.words, lower.length, speech.text.length]);
      for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= lower.length; i++) {
        const gram = lower.slice(i, i + n);
        let positions = grams.get(gram);
        if (!positions) { positions = []; grams.set(gram, positions); }
        positions.push(offset + i);
      }
      write(path.join(output, 'details', `${id}.json`), JSON.stringify({ ...speech, id }));
      offset += lower.length + 1;
    }
    writeFileSync(path.join(output, 'texts.bin'), Buffer.concat(speeches.map(speech => Buffer.from(speech.text, 'utf16le'))));
    let postingBytes = 0, postingGzipBytes = 0;
    for (const [gram, positions] of grams) {
      const bytes = encodePostings(positions);
      postingBytes += bytes.length;
      const compressed = gzipSync(bytes);
      postingGzipBytes += compressed.length;
      const file = path.join(output, 'grams', gramFilename(gram));
      writeFileSync(file, bytes); writeFileSync(`${file}.gz`, compressed);
    }
    const index = { version: SPEECH_INDEX_VERSION, editionId: edition.id, dataVersion: manifest.dataVersion, manifestSha256, sourceSha256,
      speakers: speakers.values, parties: parties.values, types: types.values, rows, grams: [...grams].map(([gram, values]) => [gram, values.length]) };
    const json = JSON.stringify(index);
    write(path.join(output, 'index.json'), json, true);
    reports.push({ editionId: edition.id, directory, speeches: speeches.length, grams: grams.size, metadataGzipBytes: gzipSync(json).length, postingBytes, postingGzipBytes });
  }
  return reports;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dataRoot = path.resolve(process.argv[2] || fileURLToPath(new URL('../dist/data', import.meta.url)));
  if (dataRoot === path.resolve(fileURLToPath(new URL('../public/data', import.meta.url)))) throw new Error('Generate search sidecars in dist, not frozen public data');
  console.log(JSON.stringify(buildSpeechSearch(dataRoot), null, 2));
}
