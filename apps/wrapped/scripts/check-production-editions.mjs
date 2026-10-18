import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function manifestsBelow(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((entry) => {
    const file = path.join(root, entry);
    if (statSync(file).isDirectory()) return manifestsBelow(file);
    return entry === 'manifest.json' ? [file] : [];
  });
}

/** Fail closed unless a preview is explicitly registered as server-protected. */
export function checkProductionEditions(dataRoot) {
  const registryFile = path.join(dataRoot, 'editions.json');
  if (!existsSync(registryFile)) throw new Error(`Missing production edition registry: ${registryFile}`);
  const registry = readJson(registryFile);
  const current = registry.editions?.find(edition => edition.id === registry.currentEdition);
  if (!current || current.status !== 'published') {
    throw new Error('Production currentEdition must reference a published edition');
  }
  const protectedManifestFiles = new Set();
  for (const edition of registry.editions) {
    if (edition.status === 'published') continue;
    if (edition.status !== 'preview' || edition.access !== 'basic-auth') {
      throw new Error(`Production registry contains unprotected non-published edition: ${edition.id}`);
    }
    protectedManifestFiles.add(path.resolve(dataRoot, edition.manifestUrl.replace(/^\/data\//, '')));
  }

  for (const manifestFile of manifestsBelow(dataRoot)) {
    const manifest = readJson(manifestFile);
    if (manifest.status === 'preview' && !protectedManifestFiles.has(path.resolve(manifestFile))) {
      throw new Error(`Production data contains unregistered or unprotected preview manifest: ${path.relative(dataRoot, manifestFile)}`);
    }
  }
  return registry;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '../public/data'));
  checkProductionEditions(root);
  console.log(`Production edition check passed: ${root}`);
}
