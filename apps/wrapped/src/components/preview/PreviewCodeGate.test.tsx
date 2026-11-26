import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureSite } from '@/lib/site';
import { getPreviewCode } from '@/lib/preview-code';
import { PreviewCodeGate } from './PreviewCodeGate';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  configureSite({ embedded: true });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
  configureSite({ embedded: false });
});

async function submit(code: string) {
  const input = container.querySelector('input')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, code);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
}

describe('PreviewCodeGate', () => {
  it('explains the preview and offers the code field and button', () => {
    act(() => root.render(<PreviewCodeGate probePath="/data/2026/v1/manifest.json" onUnlocked={() => {}} />));
    expect(container.textContent).toContain('Zugangscode');
    expect(container.querySelector('button')?.textContent).toBe('Freischalten');
    expect(container.textContent).toContain('noch nicht öffentlich');
  });

  it('says so on a wrong code and stores nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const onUnlocked = vi.fn();
    act(() => root.render(<PreviewCodeGate probePath="/data/2026/v1/manifest.json" onUnlocked={onUnlocked} />));
    await submit('falsch');
    expect(container.textContent).toContain('Der Code stimmt nicht.');
    expect(getPreviewCode()).toBeNull();
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it('keeps a right code and loads again', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const onUnlocked = vi.fn();
    act(() => root.render(<PreviewCodeGate probePath="/data/2026/v1/manifest.json" onUnlocked={onUnlocked} />));
    await submit('Aigner');
    expect(fetch.mock.calls[0][1]).toMatchObject({ headers: { 'X-Gartenzaun': 'aigner' } });
    expect(getPreviewCode()).toBe('aigner');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });
});
