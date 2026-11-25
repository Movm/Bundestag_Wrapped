import * as WebBrowser from 'expo-web-browser';
import { type MenuEntry, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { createMenuBridge, parseMenuOpen, type MenuState } from './useMenuBridge';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({})) }));

const entry: MenuEntry = { href: '/2026', label: 'a', title: 'A', color: 'pink', rotate: 0, tile: false, active: true };
const open: Extract<WebToNative, { type: 'menu.open' }> = {
  type: 'menu.open',
  entries: [entry],
  canRestart: true,
};

function setup() {
  const send = jest.fn();
  let state: MenuState | null = null;
  const bridge = createMenuBridge(send, next => {
    state = next;
  });
  return { send, bridge, state: () => state };
}

beforeEach(() => (WebBrowser.openBrowserAsync as jest.Mock).mockClear());

describe('menu bridge', () => {
  it('open stores the payload without the message type', () => {
    const { bridge, state } = setup();
    bridge.open(open);
    expect(state()).toEqual({ entries: open.entries, canRestart: true });
  });

  it('choose sends navigate once even when tapped twice, then closes', () => {
    const { bridge, send, state } = setup();
    bridge.open(open);
    bridge.choose('/2026/abgeordnete');
    bridge.choose('/2026/abgeordnete');
    expect(send.mock.calls.filter(([m]) => m.type === 'navigate')).toHaveLength(1);
    expect(send).toHaveBeenCalledWith({ type: 'navigate', href: '/2026/abgeordnete' });
    expect(state()).toBeNull();
  });

  it('a reopened menu accepts a new choice', () => {
    const { bridge, send } = setup();
    bridge.open(open);
    bridge.choose('/a');
    bridge.open(open);
    bridge.choose('/b');
    expect(send.mock.calls.filter(([m]) => m.type === 'navigate')).toHaveLength(2);
  });

  it('absolute https hrefs (cards and footer) open the in-app browser instead of navigating', () => {
    const { bridge, send, state } = setup();
    bridge.open(open);
    bridge.choose('https://www.moritz-waechter.de/impressum');
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://www.moritz-waechter.de/impressum');
    expect(send).not.toHaveBeenCalled();
    expect(state()).toBeNull();
  });

  it('restart sends restart and closes', () => {
    const { bridge, send, state } = setup();
    bridge.open(open);
    bridge.restart();
    expect(send).toHaveBeenCalledWith({ type: 'restart' });
    expect(state()).toBeNull();
  });

  it('close just closes', () => {
    const { bridge, send, state } = setup();
    bridge.open(open);
    bridge.close();
    expect(state()).toBeNull();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: 'menu.closed' });
  });

  it('menu.closed is sent once per open, also after close and choose together', () => {
    const { bridge, send } = setup();
    bridge.open(open);
    bridge.close();
    bridge.close();
    expect(send.mock.calls.filter(([m]) => m.type === 'menu.closed')).toHaveLength(1);
    bridge.open(open);
    bridge.choose('/a');
    bridge.close();
    expect(send.mock.calls.filter(([m]) => m.type === 'menu.closed')).toHaveLength(2);
  });

  it('with a deferred modal (iOS) menu.closed waits for onDismiss', () => {
    const send = jest.fn();
    const bridge = createMenuBridge(send, () => {}, true);
    bridge.open(open);
    bridge.close();
    expect(send).not.toHaveBeenCalled();
    bridge.dismissed();
    bridge.dismissed();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: 'menu.closed' });
  });

  it('after an external link menu.closed follows the in-app browser', async () => {
    const send = jest.fn();
    const bridge = createMenuBridge(send, () => {}, true);
    bridge.open(open);
    bridge.choose('https://x.test/a');
    bridge.dismissed();
    expect(send).not.toHaveBeenCalled();
    await Promise.resolve();
    await Promise.resolve();
    expect(send).toHaveBeenCalledWith({ type: 'menu.closed' });
  });

  it('restart sends once even when tapped twice', () => {
    const { bridge, send } = setup();
    bridge.open(open);
    bridge.restart();
    bridge.restart();
    expect(send.mock.calls.filter(([m]) => m.type === 'restart')).toHaveLength(1);
  });

  it('with deferred external links the browser opens only after the modal dismissed, exactly once', () => {
    const send = jest.fn();
    let state: MenuState | null = null;
    const bridge = createMenuBridge(send, next => { state = next; }, true);
    bridge.open(open);
    bridge.choose('https://x.test/a');
    bridge.choose('https://x.test/a');
    expect(state).toBeNull();
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
    bridge.dismissed();
    bridge.dismissed();
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledTimes(1);
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://x.test/a');
  });

  it('dismissed without a pending link does nothing', () => {
    const { bridge } = setup();
    bridge.dismissed();
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });
});

describe('menu.open payload validation', () => {
  it('falls back to white for an unknown colour and drops malformed entries and links', () => {
    const parsed = parseMenuOpen({
      type: 'menu.open',
      entries: [{ ...entry, color: 'teal' }, null, { href: 5 }, 'x'],
      canRestart: 'yes',
    });
    expect(parsed?.entries).toHaveLength(1);
    expect(parsed?.entries[0].color).toBe('white');
    expect(parsed).not.toHaveProperty('footer');
    expect(parsed?.canRestart).toBe(false);
  });

  it('ignores a payload without usable entries: no state change', () => {
    const { bridge, state } = setup();
    bridge.open({ type: 'menu.open', entries: 'nope', canRestart: false } as never);
    bridge.open({ type: 'menu.open', entries: [], canRestart: false });
    expect(state()).toBeNull();
  });

  it('treats an http:// link as in-app navigate, not an external open', () => {
    const { bridge, send } = setup();
    bridge.open(open);
    bridge.choose('http://x.test');
    expect(send).toHaveBeenCalledWith({ type: 'navigate', href: 'http://x.test' });
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });
});
