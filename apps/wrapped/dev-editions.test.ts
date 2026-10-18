import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEV_EDITIONS_URL_PREFIX, resolveDevEditionRequest } from './dev-editions';

describe('dev edition request resolution', () => {
  const root = path.resolve('/tmp/wrapped-dev-editions');

  it('maps the local registry and edition assets into the ignored dev root', () => {
    expect(resolveDevEditionRequest('/data/editions.json?fresh=1', root)).toBe(path.join(root, 'editions.json'));
    expect(resolveDevEditionRequest(`${DEV_EDITIONS_URL_PREFIX}2026/preview/manifest.json`, root))
      .toBe(path.join(root, '2026/preview/manifest.json'));
  });

  it('rejects traversal and unrelated production requests', () => {
    expect(resolveDevEditionRequest('/__dev-editions/../public/secret.json', root)).toBeNull();
    expect(resolveDevEditionRequest('/__dev-editions/%2e%2e/public/secret.json', root)).toBeNull();
    expect(resolveDevEditionRequest('/data/2025/final/manifest.json', root)).toBeNull();
  });
});
