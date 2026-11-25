import { act, Activity } from 'react';
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

function slide(active: boolean, mode: 'visible' | 'hidden' = 'visible') {
  return <SlideEffectsContext.Provider value={active}><Activity mode={mode}><IntroSlide onStart={onStart} /></Activity></SlideEffectsContext.Provider>;
}

let pageState: DocumentVisibilityState = 'visible';
/** Like WKWebView on app switch: visibilitychange, then SlideSection turns effects off (and, 4 s later, hides the Activity). */
function setPage(state: DocumentVisibilityState) {
  pageState = state;
  document.dispatchEvent(new Event('visibilitychange'));
}
const coverReports = () => send.mock.calls.map(([m]) => m).filter(m => m.type === 'cover');

beforeEach(() => {
  pageState = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => pageState });
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
  delete (document as { visibilityState?: unknown }).visibilityState;
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

  it('an app switch is not leaving the cover: no visible false, no replay on return', () => {
    act(() => root.render(slide(true)));
    send.mockClear();
    act(() => { setPage('hidden'); root.render(slide(false)); });
    act(() => root.render(slide(false, 'hidden')));
    expect(coverReports()).toEqual([]);
    act(() => { setPage('visible'); root.render(slide(true)); });
    // Nothing new to say: native keeps its cover as it was and does not run the assembly again.
    expect(coverReports()).toEqual([]);
    act(() => shell.receive({ type: 'story.start' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('a story.start delivered while the page is hidden starts the story exactly once', () => {
    act(() => root.render(slide(true)));
    act(() => { setPage('hidden'); root.render(slide(false)); });
    act(() => shell.receive({ type: 'story.start' }));
    act(() => shell.receive({ type: 'story.start' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(startPrimed).toHaveBeenCalledTimes(1);
    expect(coverReports().some(m => !m.visible)).toBe(false);
  });

  it('a story.start that arrives after the Activity hid the backgrounded slide is handled on return, once', () => {
    act(() => root.render(slide(true)));
    act(() => { setPage('hidden'); root.render(slide(false)); });
    act(() => root.render(slide(false, 'hidden')));
    act(() => shell.receive({ type: 'story.start' }));
    expect(onStart).not.toHaveBeenCalled();
    act(() => { setPage('visible'); root.render(slide(true)); });
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(coverReports().some(m => !m.visible)).toBe(false);
  });

  it('drops a story.start buffered before this slide reported its cover (remount after unmount)', () => {
    act(() => root.render(slide(true)));
    act(() => root.unmount());
    // Crossed the visible:false in flight; no listener, so native-shell buffers it.
    act(() => shell.receive({ type: 'story.start' }));
    root = createRoot(container);
    act(() => root.render(slide(true)));
    expect(onStart).not.toHaveBeenCalled();
    // The restarted cover still starts on its own press.
    act(() => shell.receive({ type: 'story.start' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('drops a story.start buffered after the slide left the cover and its Activity hid', () => {
    act(() => root.render(slide(true)));
    act(() => root.render(slide(false)));
    act(() => root.render(slide(false, 'hidden')));
    act(() => shell.receive({ type: 'story.start' }));
    act(() => root.render(slide(true)));
    expect(onStart).not.toHaveBeenCalled();
    act(() => shell.receive({ type: 'story.start' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
