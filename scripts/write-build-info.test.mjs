import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import test from 'node:test';
import { createBuildInfo } from './write-build-info.mjs';

test('records installed versions, remains deterministic, and detects lockfile changes', () => {
  const root = mkdtempSync(join(tmpdir(), 'wrapped-build-info-'));
  function write(path, value) { const file = join(root, path); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, value); }
  try {
    write('package.json', JSON.stringify({ packageManager: 'pnpm@10.0.0' }));
    write('pnpm-lock.yaml', 'lockfileVersion: 9');
    write('apps/test/package.json', JSON.stringify({ name: 'test', dependencies: { react: '^19.0.0' }, optionalDependencies: { optional: '*' } }));
    write('node_modules/react/package.json', JSON.stringify({ version: '19.3.1' }));
    const first = createBuildInfo(root, 'apps/test');
    assert.deepEqual(first.versions, { optional: null, react: '19.3.1' });
    assert.deepEqual(createBuildInfo(root, 'apps/test'), first);
    write('runtime/node_modules/react/package.json', JSON.stringify({ version: '19.3.2' }));
    assert.equal(createBuildInfo(root, 'apps/test', join(root, 'runtime')).versions.react, '19.3.2');
    assert.throws(() => createBuildInfo(root, 'apps/test', join(root, 'missing-runtime')), /ENOENT/);
    write('pnpm-lock.yaml', 'lockfileVersion: 10');
    assert.notEqual(createBuildInfo(root, 'apps/test').dependencyFingerprint, first.dependencyFingerprint);
    rmSync(join(root, 'node_modules/react'), { recursive: true });
    assert.throws(() => createBuildInfo(root, 'apps/test'), /ENOENT/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
