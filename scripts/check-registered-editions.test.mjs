import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { validateChecksums } from './check-registered-editions.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'edition-checksums-'));
  const contents = '{"inside":true}\n';
  writeFileSync(join(root, 'inside.json'), contents);
  return {
    checksums: { 'inside.json': hash(contents) },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
    root,
  };
}

test('accepts a complete checksum map', () => {
  const { root, checksums, cleanup } = fixture();
  try {
    assert.doesNotThrow(() => validateChecksums(root, checksums));
  } finally {
    cleanup();
  }
});

test('rejects missing and unexpected checksum entries', () => {
  const { root, checksums, cleanup } = fixture();
  try {
    assert.throws(() => validateChecksums(root, {}), /missing asset inside\.json/);
    assert.throws(
      () => validateChecksums(root, { ...checksums, 'unknown.json': '0'.repeat(64) }),
      /unexpected asset unknown\.json/,
    );
  } finally {
    cleanup();
  }
});

test('rejects a checksum mismatch', () => {
  const { root, cleanup } = fixture();
  try {
    assert.throws(
      () => validateChecksums(root, { 'inside.json': '0'.repeat(64) }),
      /checksum mismatch inside\.json/,
    );
  } finally {
    cleanup();
  }
});

test('rejects absolute, traversal, and non-normalized paths', () => {
  const { root, checksums, cleanup } = fixture();
  try {
    for (const unsafe of ['/tmp/outside.json', 'C:/outside.json', '../outside.json', './inside.json', 'nested\\outside.json']) {
      assert.throws(
        () => validateChecksums(root, { ...checksums, [unsafe]: '0'.repeat(64) }),
        /invalid edition asset path|non-normalized checksum path/,
      );
    }
  } finally {
    cleanup();
  }
});

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
