import { describe, expect, it } from 'vitest';
import path from 'node:path';

import { checkPreviewAuth } from './check-preview-auth.mjs';

describe('protected preview nginx boundary', () => {
  it('protects the preview route and its raw data', () => {
    const appRoot = path.resolve(import.meta.dirname, '..');
    expect(checkPreviewAuth(appRoot)).toEqual(['2026']);
  });
});
