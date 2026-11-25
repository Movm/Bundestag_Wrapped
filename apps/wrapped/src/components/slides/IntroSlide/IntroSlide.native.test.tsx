import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlideEffectsContext } from '@/components/main-wrapped/SlideEffectsContext';
import { dismissBootCover } from '@/cover/shell';
import { _resetNativeCoverForTesting } from '@/lib/native-cover';
import { _resetNativeShellForTesting, installNativeShell } from '@/lib/native-shell';
import { useAudioStore } from '@/stores/audioStore';
import { type WebToNative } from '@/shared/native-bridge/protocol';
import { IntroSlide } from './index';

const startPrimed = vi.hoisted(() => vi.fn());
vi.mock('@/lib/theme-music', () => ({ themeMusic: { startPrimed } }));
vi.mock('@/edition/EditionProvider', () => ({
  useOptionalEdition: () => ({ editionId: '2026', manifest: { editionId: '2026', dataVersion: '1', title: 'Wrapped', year: 2026 } }),
}));

let container: HTMLDivElement;
let root: Root;
let send: ReturnType<typeof vi.fn<(message: WebToNative) => void>>;
let shell: ReturnType<typeof installNativeShell>;
const onStart = vi.fn();

function slide(active: boolean) {
  return <SlideEffectsContext.Provider value={active}><IntroSlide onStart={onStart} /></SlideEffectsContext.Provider>;
}

beforeEach(() => {
  _resetNativeShellForTesting();
  _resetNativeCoverForTesting();
  useAudioStore.setState({ isMuted: false });
  startPrimed.mockClear();
  onStart.mockClear();
  send = vi.fn();
  shell = installNativeShell(send);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  _resetNativeShellForTesting();
  _resetNativeCoverForTesting();
});

describe('IntroSlide in the native shell', () => {
  it('posts cover visible with year and muted while the intro is active and renders no cover markup', () => {
    act(() => root.render(slide(true)));
    expect(send).toHaveBeenCalledWith({ type: 'cover', visible: true, year: 2026, muted: false });
    expect(container.querySelector('.cv')).toBeNull();
  });

  it('story.start calls startPrimed and onStart once, a second story.start is ignored', () => {
    act(() => root.render(slide(true)));
    act(() => shell.receive({ type: 'story.start' }));
    act(() => shell.receive({ type: 'story.start' }));
    expect(startPrimed).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
    // The cover is shown again: a start counts once more.
    act(() => root.render(slide(false)));
    act(() => root.render(slide(true)));
    act(() => shell.receive({ type: 'story.start' }));
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it('ignores a second story.start after a mute toggle inside the same visible period', () => {
    act(() => root.render(slide(true)));
    act(() => shell.receive({ type: 'story.start' }));
    act(() => useAudioStore.setState({ isMuted: true }));
    act(() => shell.receive({ type: 'story.start' }));
    expect(startPrimed).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('ignores story.start while the cover is not visible', () => {
    act(() => root.render(slide(false)));
    act(() => shell.receive({ type: 'story.start' }));
    expect(startPrimed).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('posts visible false when the slide becomes inactive and on unmount', () => {
    act(() => root.render(slide(true)));
    act(() => root.render(slide(false)));
    expect(send).toHaveBeenLastCalledWith({ type: 'cover', visible: false, year: 2026, muted: false });
    act(() => root.render(slide(true)));
    send.mockClear();
    act(() => root.unmount());
    expect(send).toHaveBeenCalledWith({ type: 'cover', visible: false, year: 2026, muted: false });
    root = createRoot(container);
  });

  it('re-posts when the mute toggle changes while the cover is visible', () => {
    act(() => root.render(slide(true)));
    act(() => useAudioStore.setState({ isMuted: true }));
    expect(send).toHaveBeenLastCalledWith({ type: 'cover', visible: true, year: 2026, muted: true });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('dismissBootCover posts visible false in the shell and nothing in the browser', () => {
    dismissBootCover();
    expect(send).toHaveBeenCalledWith({ type: 'cover', visible: false, year: null, muted: false });
    expect(send).toHaveBeenCalledTimes(1);
    // Browser: once the shell is gone, nothing is posted anywhere.
    send.mockClear();
    _resetNativeShellForTesting();
    _resetNativeCoverForTesting();
    dismissBootCover();
    expect(send).not.toHaveBeenCalled();
  });
});
