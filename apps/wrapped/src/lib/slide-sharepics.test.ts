import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderDramaSharepic, shareSharepic } from './slide-sharepics';

function canvasFixture() {
  const gradient = { addColorStop: vi.fn() };
  const fillText = vi.fn();
  const context = new Proxy({
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillText,
    measureText: vi.fn(() => ({ width: 100 })),
  } as unknown as CanvasRenderingContext2D, {
    get(target, property) {
      if (property in target) return Reflect.get(target, property);
      const fallback = vi.fn();
      Reflect.set(target, property, fallback);
      return fallback;
    },
  });
  const canvas = {
    getContext: vi.fn(() => context),
    height: 0,
    toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['image'], { type: 'image/png' }))),
    width: 0,
  } as unknown as HTMLCanvasElement;
  return { canvas, fillText };
}

describe('slide sharepics', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders the active edition and drama leader without legacy claims', () => {
    const { canvas, fillText } = canvasFixture();
    renderDramaSharepic(canvas, {
      topZwischenrufer: [{ name: 'Leader Eins', party: 'Partei Omega', count: 17 }],
    }, 'Fixture Wrapped 2026');

    const text = fillText.mock.calls.map(([value]) => String(value));
    expect(text).toContain('FIXTURE WRAPPED 2026');
    expect(text).toContain('Partei Omega: 17 Zwischenrufe');
    expect(text.join(' ')).not.toMatch(/AfD|4\.000/);
  });

  it('falls back to a URL share when file sharing is unavailable', async () => {
    const { canvas } = canvasFixture();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });

    await expect(shareSharepic(canvas, {
      filename: 'bundestag-wrapped-2026-drama.png',
      title: 'Fixture Wrapped 2026',
      url: 'https://example.test/2026',
    })).resolves.toBe(true);
    expect(share).toHaveBeenCalledWith({
      title: 'Fixture Wrapped 2026',
      url: 'https://example.test/2026',
    });
  });
});
