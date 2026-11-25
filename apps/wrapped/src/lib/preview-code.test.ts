import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkPreviewCode, getPreviewCode, normalizePreviewCode, setPreviewCode } from './preview-code';
import { configureSite } from './site';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  configureSite({ embedded: false });
});

describe('preview code', () => {
  it('normalises like /zugang/ and the entrypoint', () => {
    expect(normalizePreviewCode(' AI gner!_1-x ')).toBe('aigner_1-x');
  });

  it('stores the normalised code and refuses an empty one', () => {
    expect(setPreviewCode('  ')).toBe(false);
    expect(getPreviewCode()).toBeNull();
    expect(setPreviewCode('Aigner')).toBe(true);
    expect(getPreviewCode()).toBe('aigner');
  });

  it('survives unavailable storage', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
    expect(getPreviewCode()).toBeNull();
    expect(setPreviewCode('aigner')).toBe(false);
  });

  it.each([[401, 'wrong'], [200, 'ok'], [500, 'unreachable']] as const)('check: status %s is %s', async (status, expected) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
    configureSite({ embedded: true });
    expect(await checkPreviewCode('/data/2026/v1/manifest.json', 'Aigner')).toBe(expected);
    expect(fetch).toHaveBeenCalledWith('https://bundestag-wrapped.de/data/2026/v1/manifest.json', expect.objectContaining({ headers: { 'X-Gartenzaun': 'aigner' } }));
  });

  it('check: a network failure is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    expect(await checkPreviewCode('/data/2026/x.json', 'a')).toBe('unreachable');
  });
});
