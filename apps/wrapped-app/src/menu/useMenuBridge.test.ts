import * as WebBrowser from 'expo-web-browser';
import { type MenuEntry, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { createMenuBridge, type MenuState } from './useMenuBridge';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({})) }));

const entry: MenuEntry = { href: '/2026', label: 'a', title: 'A', color: 'pink', rotate: 0, tile: false, active: true };
const open: Extract<WebToNative, { type: 'menu.open' }> = {
  type: 'menu.open',
  entries: [entry],
  footer: [{ href: '/datenschutz', label: 'Datenschutz', external: false }],
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
    expect(state()).toEqual({ entries: open.entries, footer: open.footer, canRestart: true });
  });

  it('choose sends navigate once even when tapped twice, then closes', () => {
    const { bridge, send, state } = setup();
    bridge.open(open);
    bridge.choose('/2026/abgeordnete');
    bridge.choose('/2026/abgeordnete');
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: 'navigate', href: '/2026/abgeordnete' });
    expect(state()).toBeNull();
  });

  it('a reopened menu accepts a new choice', () => {
    const { bridge, send } = setup();
    bridge.open(open);
    bridge.choose('/a');
    bridge.open(open);
    bridge.choose('/b');
    expect(send).toHaveBeenCalledTimes(2);
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
    expect(send).not.toHaveBeenCalled();
  });
});
