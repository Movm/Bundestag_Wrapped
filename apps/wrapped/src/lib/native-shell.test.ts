import { afterEach, describe, expect, it, vi } from 'vitest';
import { _resetNativeShellForTesting, installNativeShell, isNativeShell, onNativeMessage, postToNative, setNativeShellInfo } from './native-shell';

afterEach(() => _resetNativeShellForTesting());

describe('native shell', () => {
  it('is not a native shell until installed; postToNative is a no-op', () => {
    expect(isNativeShell()).toBe(false);
    expect(() => postToNative({ type: 'openUrl', url: 'https://x.test' })).not.toThrow();
    const send = vi.fn();
    installNativeShell(send);
    expect(isNativeShell()).toBe(true);
    postToNative({ type: 'openUrl', url: 'https://x.test' });
    expect(send).toHaveBeenCalledWith({ type: 'openUrl', url: 'https://x.test' });
  });

  it('delivers messages received before the first handler registered', () => {
    const shell = installNativeShell(vi.fn());
    shell.receive({ type: 'navigate', href: '/2026' });
    shell.receive({ type: 'restart' });
    const onNavigate = vi.fn();
    onNativeMessage('navigate', onNavigate);
    expect(onNavigate).toHaveBeenCalledWith({ type: 'navigate', href: '/2026' });
    const onRestart = vi.fn();
    onNativeMessage('restart', onRestart);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('delivers later messages to handlers and stops after unsubscribe', () => {
    const shell = installNativeShell(vi.fn());
    const handler = vi.fn();
    const off = onNativeMessage('story.start', handler);
    shell.receive({ type: 'story.start' });
    off();
    shell.receive({ type: 'story.start' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('menu.closed before subscribe is not delivered later', () => {
    const shell = installNativeShell(vi.fn());
    shell.receive({ type: 'menu.closed' });
    const handler = vi.fn();
    onNativeMessage('menu.closed', handler);
    expect(handler).not.toHaveBeenCalled();
    shell.receive({ type: 'menu.closed' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('publishes window.__WRAPPED_NATIVE__', () => {
    expect(window.__WRAPPED_NATIVE__).toBeUndefined();
    setNativeShellInfo({ protocol: 1, platform: 'ios', appVersion: '1.0.0' });
    expect(window.__WRAPPED_NATIVE__).toEqual({ protocol: 1, platform: 'ios', appVersion: '1.0.0' });
  });
});
