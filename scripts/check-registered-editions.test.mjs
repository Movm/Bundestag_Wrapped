import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { validateChecksums } from './check-registered-editions.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');

test('rejects a checksum asset that is a symbolic link outside the edition root', () => {
  const root = mkdtempSync(join(tmpdir(), 'edition-checksums-'));
  const outsideRoot = mkdtempSync(join(tmpdir(), 'edition-outside-'));
  const outside = join(outsideRoot, 'outside.json');
  try {
    writeFileSync(outside, '{"outside":true}\n');
    symlinkSync(outside, join(root, 'escape.json'));
    assert.throws(
      () => validateChecksums(root, { 'escape.json': hash('{"outside":true}\n') }),
      /symbolic link/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outsideRoot, { recursive: true, force: true });
  }
});
