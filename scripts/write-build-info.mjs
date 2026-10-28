import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const digest = value => createHash('sha256').update(value).digest('hex');
export function createBuildInfo(root, packagePath, installedRoot) {
  const manifest = readFileSync(resolve(root, packagePath, 'package.json'));
  const pkg = JSON.parse(manifest);
  const optional = pkg.optionalDependencies ?? {};
  const versions = {};
  for (const name of Object.keys({ ...pkg.dependencies, ...optional }).sort()) {
    const local = resolve(installedRoot ?? resolve(root, packagePath), 'node_modules', name, 'package.json');
    const installed = installedRoot || existsSync(local) ? local : resolve(root, 'node_modules', name, 'package.json');
    try { versions[name] = JSON.parse(readFileSync(installed, 'utf8')).version; }
    catch (error) {
      if (!(name in optional) || error.code !== 'ENOENT') throw error;
      versions[name] = null;
    }
  }
  const inputs = {
    packageName: pkg.name,
    packageManifestSha256: digest(manifest),
    lockfileSha256: digest(readFileSync(resolve(root, 'pnpm-lock.yaml'))),
    packageManager: JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).packageManager,
    nodeVersion: process.version,
    versions,
  };
  return { ...inputs, dependencyFingerprint: digest(JSON.stringify(inputs)), sourceCommit: process.env.SOURCE_COMMIT || process.env.GITHUB_SHA || null };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, '..');
  const output = resolve(root, process.argv[3]);
  mkdirSync(dirname(output), { recursive: true });
  const info = createBuildInfo(root, process.argv[2], process.argv[4]);
  writeFileSync(output, JSON.stringify(info, null, 2) + '\n');
  console.log(`Dependency fingerprint: ${info.dependencyFingerprint}`);
}
