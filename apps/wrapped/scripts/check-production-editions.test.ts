import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkProductionEditions } from './check-production-editions.mjs';

function writeJson(file: string, payload: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(payload)}\n`);
}

describe('production edition guard', () => {
  it('accepts a registry containing only a published edition', ({ task }) => {
    const root = path.join('/tmp', `wrapped-production-${task.id}`);
    writeJson(path.join(root, 'editions.json'), {
      currentEdition: '2025',
      editions: [{ id: '2025', status: 'published' }],
    });
    writeJson(path.join(root, '2025/final/manifest.json'), { status: 'frozen' });
    expect(checkProductionEditions(root).currentEdition).toBe('2025');
  });

  it('accepts a server-protected preview without making it current', ({ task }) => {
    const root = path.join('/tmp', `wrapped-protected-preview-${task.id}`);
    writeJson(path.join(root, 'editions.json'), {
      currentEdition: '2025',
      editions: [
        { id: '2025', status: 'published' },
        { id: '2026', status: 'preview', access: 'basic-auth', manifestUrl: '/data/2026/preview/manifest.json' },
      ],
    });
    writeJson(path.join(root, '2026/preview/manifest.json'), { status: 'preview' });
    expect(checkProductionEditions(root).currentEdition).toBe('2025');
  });

  it('rejects unprotected registry entries and unregistered preview artifacts', ({ task }) => {
    const registryRoot = path.join('/tmp', `wrapped-registry-preview-${task.id}`);
    writeJson(path.join(registryRoot, 'editions.json'), {
      currentEdition: '2025',
      editions: [
        { id: '2025', status: 'published' },
        { id: '2026', status: 'preview' },
      ],
    });
    expect(() => checkProductionEditions(registryRoot)).toThrow('unprotected non-published edition: 2026');

    const artifactRoot = path.join('/tmp', `wrapped-artifact-preview-${task.id}`);
    writeJson(path.join(artifactRoot, 'editions.json'), {
      currentEdition: '2025',
      editions: [{ id: '2025', status: 'published' }],
    });
    writeJson(path.join(artifactRoot, '2026/preview/manifest.json'), { status: 'preview' });
    expect(() => checkProductionEditions(artifactRoot)).toThrow('unregistered or unprotected preview manifest');
  });
});
