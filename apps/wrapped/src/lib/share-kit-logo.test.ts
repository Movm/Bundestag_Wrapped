import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { preloadShareAssets, _resetLogoForTesting } from './share-kit';
import { configureSite } from './site';

// Captures the Image the loader creates; onload fires once src is set.
let created: HTMLImageElement[] = [];

beforeEach(() => {
  created = [];
  _resetLogoForTesting();
  vi.stubGlobal('createImageBitmap', undefined);
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      crossOrigin: string | null = null;
      decode = () => Promise.resolve();
      private _src = '';
      constructor() { created.push(this as unknown as HTMLImageElement); }
      get src() { return this._src; }
      set src(v: string) { this._src = v; queueMicrotask(() => this.onload?.()); }
    },
  );
});

afterEach(() => {
  configureSite({ embedded: false });
  _resetLogoForTesting();
  vi.unstubAllGlobals();
});

describe('share logo loader', () => {
  it('sets crossOrigin=anonymous when embedded, before src', async () => {
    configureSite({ embedded: true });
    await preloadShareAssets();
    expect(created).toHaveLength(1);
    expect(created[0].crossOrigin).toBe('anonymous');
    expect(created[0].src).toBe('https://bundestag-wrapped.de/logo.png');
  });

  it('leaves crossOrigin untouched in the browser', async () => {
    configureSite({ embedded: false });
    await preloadShareAssets();
    expect(created).toHaveLength(1);
    expect(created[0].crossOrigin).toBeNull();
    expect(created[0].src).toBe('/logo.png');
  });
});
