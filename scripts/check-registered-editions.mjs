import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const publicData = resolve('apps/wrapped/public/data');
const json = (file) => JSON.parse(readFileSync(file, 'utf8'));
const fail = (message) => { throw new Error(message); };
const relative = (base, url) => join(base, url.replace(/^\//, ''));
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

function checkEdition(summary) {
  const manifestFile = relative(resolve('apps/wrapped/public'), summary.manifestUrl);
  if (!existsSync(manifestFile)) fail(`${summary.id}: missing manifest ${summary.manifestUrl}`);
  const manifest = json(manifestFile);
  if (manifest.editionId !== summary.id || manifest.year !== summary.year) fail(`${summary.id}: index and manifest disagree`);
  const base = dirname(manifestFile);
  const required = [manifest.content, manifest.assets.wrapped, manifest.assets.speakerIndex, manifest.assets.speakersBase, manifest.assets.speeches, manifest.assets.words, manifest.assets.wordRankings, manifest.assets.topicRankings, manifest.checksums];
  for (const asset of required) if (!existsSync(join(base, asset))) fail(`${summary.id}: missing asset ${asset}`);
  const content = json(join(base, manifest.content));
  const wrapped = json(join(base, manifest.assets.wrapped));
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
  for (const speaker of speakerIndex.speakers ?? []) {
    const file = join(base, manifest.assets.speakersBase, `${speaker.slug}.json`);
    if (!existsSync(file)) fail(`${summary.id}: speaker index references missing ${speaker.slug}`);
  }
}

const registry = json(join(publicData, 'editions.json'));
if (!registry.editions?.some((edition) => edition.id === registry.currentEdition)) fail('currentEdition is not registered');
registry.editions.forEach(checkEdition);
console.log(`Registered editions check passed (${registry.editions.length} editions).`);
