import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(appRoot, '../..');
const analysisRoot = path.join(repoRoot, 'services/analysis');

function parseArgs(values) {
  const options = {
    edition: '2026',
    from: '2026-01-01',
    to: '2026-10-12',
    version: 'preview-2026-10-12-context-v4',
    wahlperiode: '21',
    server: 'https://bundestagapi.moritz-waechter.de/mcp',
    quizConfig: '',
    compareWith: '',
    youthWords: '',
    signatureConfig: '',
    editionSignatureConfig: '',
    comparisonFrom: '',
    comparisonTo: '',
    comparisonWahlperioden: '',
    comparisonVersion: '',
  };
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]
      ?.replace(/^--/, '')
      .replace(/-([a-z])/g, (_match, character) => character.toUpperCase());
    const value = values[index + 1];
    if (!key || value === undefined || !(key in options)) {
      throw new Error(`Unknown or incomplete argument: ${values[index] ?? ''}`);
    }
    options[key] = value;
  }
  return options;
}

function analysisExecutable() {
  if (process.env.BUNDESTAG_ANALYSIS_BIN) return process.env.BUNDESTAG_ANALYSIS_BIN;
  const candidates = process.platform === 'win32'
    ? [path.join(analysisRoot, '.venv/Scripts/bundestag-analysis.exe')]
    : [path.join(analysisRoot, '.venv/bin/bundestag-analysis')];
  return candidates.find(existsSync) ?? 'bundestag-analysis';
}

function run(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: analysisRoot,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${executable} ${args[0]} failed with exit code ${result.status}`);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function buildDevRegistry(productionRegistry, manifest, version) {
  const preview = {
    id: manifest.editionId,
    manifestUrl: `/__dev-editions/${manifest.editionId}/${version}/manifest.json`,
    status: 'preview',
    year: manifest.year,
  };
  return {
    ...productionRegistry,
    editions: [
      ...productionRegistry.editions.filter(edition => edition.id !== manifest.editionId),
      preview,
    ].sort((a, b) => a.year - b.year),
  };
}

export function prepareDevEdition(rawArgs = process.argv.slice(2)) {
  const options = parseArgs(rawArgs);
  if (!/^\d{4}$/.test(options.edition)) throw new Error('--edition must be a four-digit year');
  if (!options.from.startsWith(`${options.edition}-`) || !options.to.startsWith(`${options.edition}-`)) {
    throw new Error('--from and --to must be within the edition year');
  }
  if (options.edition === '2026') {
    options.quizConfig ||= path.join(appRoot, 'config/2026/quiz.json');
    options.youthWords ||= path.join(appRoot, 'config/2026/youth-words.json');
    options.signatureConfig ||= path.join(appRoot, 'config/signature-words.json');
    options.editionSignatureConfig ||= path.join(appRoot, 'config/2026/signature-words.json');
    options.comparisonFrom ||= '2025-01-01';
    options.comparisonTo ||= '2025-10-12';
    options.comparisonWahlperioden ||= '20,21';
    options.comparisonVersion ||= 'comparison-2025-10-12-signatures-v1';
  }

  const executable = analysisExecutable();
  const workRoot = path.join(
    repoRoot,
    'work/dev-editions',
    `${options.edition}-${options.from}-${options.to}-wp${options.wahlperiode}`,
  );
  const dataDir = path.join(workRoot, 'data');
  const resultsDir = path.join(workRoot, 'results');
  const outputRoot = path.join(appRoot, '.dev-editions');
  const target = path.join(outputRoot, options.edition, options.version);
  mkdirSync(workRoot, { recursive: true });

  run(executable, ['--server', options.server, 'download', dataDir, '--from', options.from, '--to', options.to, '--wahlperiode', options.wahlperiode]);
  run(executable, ['parse', dataDir]);
  run(executable, ['analyze', dataDir, '--wahlperiode', options.wahlperiode, '--output-dir', resultsDir, '--quiet']);

  if (!options.compareWith && options.comparisonFrom && options.comparisonTo) {
    const comparisonWorkRoot = path.join(
      repoRoot,
      'work/comparison-editions',
      `2025-${options.comparisonFrom}-${options.comparisonTo}-wp${options.comparisonWahlperioden.replaceAll(',', '-')}`,
    );
    const comparisonDataDir = path.join(comparisonWorkRoot, 'data');
    const comparisonResultsDir = path.join(comparisonWorkRoot, 'results');
    const comparisonOutputRoot = path.join(repoRoot, 'work/comparison-editions');
    const comparisonTarget = path.join(comparisonOutputRoot, '2025', options.comparisonVersion);
    const comparisonWahlperioden = options.comparisonWahlperioden.split(',').map(value => value.trim()).filter(Boolean);
    if (!existsSync(comparisonTarget)) {
      const downloadArgs = ['--server', options.server, 'download', comparisonDataDir, '--from', options.comparisonFrom, '--to', options.comparisonTo];
      for (const wahlperiode of comparisonWahlperioden) downloadArgs.push('--wahlperiode', wahlperiode);
      run(executable, downloadArgs);
      run(executable, ['parse', comparisonDataDir]);
      run(executable, ['analyze', comparisonDataDir, '--wahlperiode', comparisonWahlperioden.at(-1) ?? '21', '--output-dir', comparisonResultsDir, '--quiet']);
      const baselineArgs = [
        'generate-edition',
        '--edition', '2025',
        '--from', options.comparisonFrom,
        '--to', options.comparisonTo,
        '--data-version', options.comparisonVersion,
        '--data-dir', comparisonDataDir,
        '--results-dir', comparisonResultsDir,
        '--output', comparisonOutputRoot,
      ];
      for (const wahlperiode of comparisonWahlperioden) baselineArgs.push('--wahlperiode', wahlperiode);
      if (options.signatureConfig) baselineArgs.push('--signature-config', options.signatureConfig);
      if (options.editionSignatureConfig) baselineArgs.push('--signature-config', options.editionSignatureConfig);
      run(executable, baselineArgs);
    }
    options.compareWith = comparisonTarget;
  }

  // Local previews are reproducible scratch artifacts. Re-running the same
  // version replaces only that exact ignored target.
  rmSync(target, { recursive: true, force: true });
  const editionArgs = [
    'generate-edition',
    '--edition', options.edition,
    '--from', options.from,
    '--to', options.to,
    '--wahlperiode', options.wahlperiode,
    '--data-version', options.version,
    '--data-dir', dataDir,
    '--results-dir', resultsDir,
    '--output', outputRoot,
  ];
  if (options.quizConfig) editionArgs.push('--quiz-config', options.quizConfig);
  if (options.compareWith) editionArgs.push('--compare-with', options.compareWith);
  if (options.youthWords) editionArgs.push('--youth-words', options.youthWords);
  if (options.signatureConfig) editionArgs.push('--signature-config', options.signatureConfig);
  if (options.editionSignatureConfig) editionArgs.push('--signature-config', options.editionSignatureConfig);
  run(executable, editionArgs);

  const manifest = readJson(path.join(target, 'manifest.json'));
  if (manifest.status !== 'preview' || manifest.coverage?.complete !== false) {
    throw new Error('Generated local edition must remain an incomplete preview');
  }
  const productionRegistry = readJson(path.join(appRoot, 'public/data/editions.json'));
  const devRegistry = buildDevRegistry(productionRegistry, manifest, options.version);
  writeFileSync(path.join(outputRoot, 'editions.json'), `${JSON.stringify(devRegistry, null, 2)}\n`);

  console.log(`\nLocal ${options.edition} preview ready at /${options.edition}`);
  console.log(`Coverage: ${manifest.coverage.firstProtocolDate} to ${manifest.coverage.lastProtocolDate} (${manifest.coverage.protocolCount} protocols)`);
  console.log('Start it with: pnpm dev:web');
  return { manifest, target };
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) {
  try {
    prepareDevEdition();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
