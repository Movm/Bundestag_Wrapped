// Local quiz preview without rerunning the analysis pipeline.
//
// `generate-edition --quiz-config` only changes two things that the quiz reads:
// it copies the quiz config into content.json (cli/commands/wrapped.py) and it
// marks the Jugendwort winner as `winnerYear` in the year-over-year block
// (edition/comparison.py). This script applies exactly those two changes to the
// committed protected preview, recomputes checksums and registers the result as
// an ignored dev edition, so `pnpm dev:web` shows the current quiz in seconds.
// It never touches public/data; the real preview still needs a regenerated
// edition before release.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDevRegistry } from './prepare-dev-edition.mjs';

const appRoot = path.resolve(import.meta.dirname, '..');

const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

function filesBelow(root, prefix = '') {
  return readdirSync(path.join(root, prefix)).flatMap(name => {
    const relative = prefix ? `${prefix}/${name}` : name;
    return statSync(path.join(root, relative)).isDirectory() ? filesBelow(root, relative) : [relative];
  });
}

export function applyWinnerYears(wrapped, lexicon) {
  const winners = new Map(
    lexicon.terms.filter(term => Number.isInteger(term.winner)).map(term => [term.word, term.winner]),
  );
  const words = wrapped.yearOverYear?.youthLanguage?.words ?? [];
  for (const entry of words) {
    if (winners.has(entry.word)) entry.winnerYear = winners.get(entry.word);
    else delete entry.winnerYear;
  }
  return wrapped;
}

export function overlayDevQuiz({
  edition = '2026',
  quizConfig = path.join(appRoot, `config/${edition}/quiz.json`),
  youthWords = path.join(appRoot, `config/${edition}/youth-words.json`),
  outputRoot = path.join(appRoot, '.dev-editions'),
} = {}) {
  const productionRegistry = readJson(path.join(appRoot, 'public/data/editions.json'));
  const entry = productionRegistry.editions.find(candidate => candidate.id === edition);
  if (!entry || entry.status !== 'preview') throw new Error(`Edition ${edition} is not a registered preview`);
  const source = path.join(appRoot, 'public', path.dirname(entry.manifestUrl));
  const sourceManifest = readJson(path.join(source, 'manifest.json'));
  const version = `${sourceManifest.dataVersion}-quiz-dev`;
  const target = path.join(outputRoot, edition, version);

  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });

  const contentFile = path.join(target, sourceManifest.content);
  writeJson(contentFile, { ...readJson(contentFile), quiz: readJson(quizConfig) });
  if (existsSync(youthWords)) {
    const wrappedFile = path.join(target, sourceManifest.assets.wrapped);
    writeJson(wrappedFile, applyWinnerYears(readJson(wrappedFile), readJson(youthWords)));
  }
  const manifest = { ...sourceManifest, dataVersion: version };
  writeJson(path.join(target, 'manifest.json'), manifest);

  const checksumFile = path.join(target, manifest.checksums);
  const checksums = Object.fromEntries(
    filesBelow(target)
      .filter(relative => relative !== manifest.checksums)
      .sort()
      .map(relative => [relative, createHash('sha256').update(readFileSync(path.join(target, relative))).digest('hex')]),
  );
  writeJson(checksumFile, checksums);

  writeJson(path.join(outputRoot, 'editions.json'), buildDevRegistry(productionRegistry, manifest, version));
  return { target, version };
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) {
  const { version } = overlayDevQuiz();
  console.log(`Local quiz preview ready: ${version}`);
  console.log('Start it with: pnpm dev:web, then open http://localhost:5173/2026');
}
