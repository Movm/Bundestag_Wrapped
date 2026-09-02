import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import contractSchema from '../contracts/wrapped/v1.schema.json' with { type: 'json' };

const publicData = resolve('apps/wrapped/public/data');
const json = (file) => JSON.parse(readFileSync(file, 'utf8'));
const fail = (message) => { throw new Error(message); };
const relative = (base, url) => join(base, url.replace(/^\//, ''));
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

function checkEdition(summary) {
  const manifestFile = relative(resolve('apps/wrapped/public'), summary.manifestUrl);
  if (!existsSync(manifestFile)) fail(`${summary.id}: missing manifest ${summary.manifestUrl}`);
  const manifest = json(manifestFile);
  validate('EditionManifest', manifest, manifestFile);
  if (manifest.editionId !== summary.id || manifest.year !== summary.year) fail(`${summary.id}: index and manifest disagree`);
  const base = dirname(manifestFile);
  const required = [manifest.content, manifest.assets.wrapped, manifest.assets.speakerIndex, manifest.assets.speakersBase, manifest.assets.speeches, manifest.assets.words, manifest.assets.wordRankings, manifest.assets.topicRankings, manifest.checksums];
  for (const asset of required) if (!existsSync(join(base, asset))) fail(`${summary.id}: missing asset ${asset}`);
  const content = json(join(base, manifest.content));
  const wrapped = json(join(base, manifest.assets.wrapped));
  validate('EditionContent', content, join(base, manifest.content));
  validate('WrappedData', wrapped, join(base, manifest.assets.wrapped));
  for (const [name, document] of [['content', content], ['wrapped', wrapped]]) {
    if (document.editionId !== undefined && document.editionId !== manifest.editionId) fail(`${summary.id}: ${name} editionId mismatch`);
    if (document.year !== undefined && document.year !== manifest.year) fail(`${summary.id}: ${name} year mismatch`);
    if (document.dataVersion !== undefined && document.dataVersion !== manifest.dataVersion) fail(`${summary.id}: ${name} dataVersion mismatch`);
  }
  const checksums = json(join(base, manifest.checksums));
  for (const [asset, expected] of Object.entries(checksums)) {
    const file = join(base, asset);
    if (!existsSync(file)) fail(`${summary.id}: checksum asset missing ${asset}`);
    if (sha256(file) !== expected) fail(`${summary.id}: checksum mismatch ${asset}`);
  }
  const speakerIndex = json(join(base, manifest.assets.speakerIndex));
  validate('SpeakerIndexAsset', speakerIndex, join(base, manifest.assets.speakerIndex));
  for (const speaker of speakerIndex.speakers ?? []) {
    const file = join(base, manifest.assets.speakersBase, `${speaker.slug}.json`);
    if (!existsSync(file)) fail(`${summary.id}: speaker index references missing ${speaker.slug}`);
    validate('SpeakerWrappedAsset', json(file), file);
  }
  validate('SpeechesAsset', json(join(base, manifest.assets.speeches)), join(base, manifest.assets.speeches));
  validate('WordsAsset', json(join(base, manifest.assets.words)), join(base, manifest.assets.words));
  validate('WordRankingsAsset', json(join(base, manifest.assets.wordRankings)), join(base, manifest.assets.wordRankings));
  validate('TopicRankingsAsset', json(join(base, manifest.assets.topicRankings)), join(base, manifest.assets.topicRankings));
}

const registry = json(join(publicData, 'editions.json'));
validate('EditionsIndex', registry, join(publicData, 'editions.json'));
if (!registry.editions?.some((edition) => edition.id === registry.currentEdition)) fail('currentEdition is not registered');
registry.editions.forEach(checkEdition);
console.log(`Registered editions check passed (${registry.editions.length} editions).`);
