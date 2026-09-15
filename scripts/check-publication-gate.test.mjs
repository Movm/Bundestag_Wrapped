import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPublicRegistryAllowed } from './check-publication-gate.mjs';

test('blocks the 2026 registry entry before the Berlin launch day', () => {
  assert.throws(() => assertPublicRegistryAllowed({ editions: [{ id: '2026' }] }, new Date('2026-11-30T22:59:00Z')), /must not be registered/);
});

test('allows the 2026 registry entry from midnight Berlin time', () => {
  assert.doesNotThrow(() => assertPublicRegistryAllowed({ editions: [{ id: '2026' }] }, new Date('2026-11-30T23:00:00Z')));
});
