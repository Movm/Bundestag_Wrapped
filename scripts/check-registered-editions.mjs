import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative as relativePath, resolve, sep } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import contractSchema from '../contracts/wrapped/v1.schema.json' with { type: 'json' };

const publicData = resolve('apps/wrapped/public/data');
const json = (file) => JSON.parse(readFileSync(file, 'utf8'));
const fail = (message) => { throw new Error(message); };
function safeRelative(base, asset) {
  if (typeof asset !== 'string' || asset.startsWith('/') || asset.split('/').includes('..')) fail(`invalid edition asset path ${asset}`);
  const file = resolve(base, asset);
  if (file !== base && !file.startsWith(`${base}${sep}`)) fail(`edition asset escapes root ${asset}`);
  return file;
}
const relative = (base, url) => safeRelative(base, url.replace(/^\//, ''));
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(contractSchema);

function validate(document, payload, file) {
  const validator = ajv.getSchema(`${contractSchema.$id}#/$defs/${document}`);
  if (!validator) fail(`contract definition missing: ${document}`);
  if (validator(payload)) return;
  const errors = (validator.errors ?? [])
    .map((error) => `${file}${error.instancePath || '/'}: ${error.message ?? error.keyword}`)
    .join('; ');
  fail(`invalid ${document}: ${errors}`);
}

function editionFiles(root, current = root) {
  return readdirSync(current).flatMap((entry) => {
    const file = join(current, entry);
    if (statSync(file).isDirectory()) return editionFiles(root, file);
    const path = relativePath(root, file).split(sep).join('/');
    return path === 'checksums.json' ? [] : [path];
  }).sort();
}

export function validateChecksums(root, checksums) {
  if (!checksums || typeof checksums !== 'object' || Array.isArray(checksums)) fail('checksums.json must be an object');
  const expected = editionFiles(root);
  const entries = Object.keys(checksums).sort();
  const duplicateTargets = new Set();
  for (const asset of entries) {
    const file = safeRelative(root, asset);
    const normalized = relativePath(root, file).split(sep).join('/');
    if (duplicateTargets.has(normalized)) fail(`duplicate checksum target ${asset}`);
    duplicateTargets.add(normalized);
    if (normalized !== asset) fail(`non-normalized checksum path ${asset}`);
  }
  for (const asset of expected) if (!Object.hasOwn(checksums, asset)) fail(`checksum missing asset ${asset}`);
  for (const asset of entries) if (!expected.includes(asset)) fail(`checksum references unexpected asset ${asset}`);
  for (const asset of expected) {
    const file = safeRelative(root, asset);
    if (typeof checksums[asset] !== 'string' || !/^[a-f0-9]{64}$/i.test(checksums[asset])) fail(`invalid checksum for ${asset}`);
    if (sha256(file) !== checksums[asset]) fail(`checksum mismatch ${asset}`);
  }
}

function checkEdition(summary) {
  const manifestFile = relative(resolve('apps/wrapped/public'), summary.manifestUrl);
  if (!existsSync(manifestFile)) fail(`${summary.id}: missing manifest ${summary.manifestUrl}`);
  const manifest = json(manifestFile);
  validate('EditionManifest', manifest, manifestFile);
  if (manifest.editionId !== summary.id || manifest.year !== summary.year) fail(`${summary.id}: index and manifest disagree`);
  const base = dirname(manifestFile);
  const required = [manifest.content, manifest.assets.wrapped, manifest.assets.speakerIndex, manifest.assets.speakersBase, manifest.assets.speeches, manifest.assets.words, manifest.assets.wordRankings, manifest.assets.topicRankings, manifest.checksums];
  for (const asset of required) if (!existsSync(safeRelative(base, asset))) fail(`${summary.id}: missing asset ${asset}`);
  const content = json(safeRelative(base, manifest.content));
  const wrapped = json(safeRelative(base, manifest.assets.wrapped));
  validate('EditionContent', content, safeRelative(base, manifest.content));
  validate('WrappedData', wrapped, safeRelative(base, manifest.assets.wrapped));
  for (const [name, document] of [['content', content], ['wrapped', wrapped]]) {
    if (document.editionId !== undefined && document.editionId !== manifest.editionId) fail(`${summary.id}: ${name} editionId mismatch`);
    if (document.year !== undefined && document.year !== manifest.year) fail(`${summary.id}: ${name} year mismatch`);
    if (document.dataVersion !== undefined && document.dataVersion !== manifest.dataVersion) fail(`${summary.id}: ${name} dataVersion mismatch`);
  }
  const checksums = json(safeRelative(base, manifest.checksums));
  validateChecksums(base, checksums);
  const speakerIndex = json(safeRelative(base, manifest.assets.speakerIndex));
  validate('SpeakerIndexAsset', speakerIndex, safeRelative(base, manifest.assets.speakerIndex));
  for (const speaker of speakerIndex.speakers ?? []) {
    const file = safeRelative(base, `${manifest.assets.speakersBase}/${speaker.slug}.json`);
    if (!existsSync(file)) fail(`${summary.id}: speaker index references missing ${speaker.slug}`);
    validate('SpeakerWrappedAsset', json(file), file);
  }
  validate('SpeechesAsset', json(safeRelative(base, manifest.assets.speeches)), safeRelative(base, manifest.assets.speeches));
  validate('WordsAsset', json(safeRelative(base, manifest.assets.words)), safeRelative(base, manifest.assets.words));
  validate('WordRankingsAsset', json(safeRelative(base, manifest.assets.wordRankings)), safeRelative(base, manifest.assets.wordRankings));
  validate('TopicRankingsAsset', json(safeRelative(base, manifest.assets.topicRankings)), safeRelative(base, manifest.assets.topicRankings));
}

const registry = json(join(publicData, 'editions.json'));
validate('EditionsIndex', registry, join(publicData, 'editions.json'));
if (!registry.editions?.some((edition) => edition.id === registry.currentEdition)) fail('currentEdition is not registered');
registry.editions.forEach(checkEdition);
console.log(`Registered editions check passed (${registry.editions.length} editions).`);
