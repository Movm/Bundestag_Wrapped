import { act } from 'react';
import { createRoot } from 'test-renderer';
import { NativeMenu } from './NativeMenu';
import { type MenuState } from './useMenuBridge';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(async () => {}) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const value = (v: number) => ({ value: v });
  return {
    __esModule: true,
    default: { View },
    Easing: { bezier: () => (t: number) => t },
    interpolate: (x: number) => x,
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => false,
    useSharedValue: value,
    withDelay: (_d: number, v: number) => v,
    withSpring: (v: number) => v,
    withTiming: (v: number) => v,
  };
});
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, Path: View };
});

const state: MenuState = {
  entries: [
    { href: '/2026', label: 'Bundestag Wrapped', title: 'Bundestag Wrapped', color: 'pink', rotate: -2, tile: false, active: true },
    { href: '/2026/abgeordnete', label: 'Abgeordnete-Wrapped', title: 'Abgeordnete-Wrapped', color: 'violet', rotate: 1.5, tile: false, active: false },
    { href: '/2026/perfect-match', label: 'Perfect Match', title: 'Perfect Match', color: 'mint', rotate: -1.5, tile: false, active: false },
    { href: '/2026/dokumentation', label: 'Dokumentation', title: 'Doku­mentation', color: 'white', rotate: -1, tile: true, active: false },
  ],
  canRestart: true,
};

const noop = () => {};
const mounted: ReturnType<typeof createRoot>[] = [];
afterEach(async () => {
  // Unmount so the focus timer of the menu body is cleared.
  for (const r of mounted.splice(0)) await act(async () => r.unmount());
});
async function render(s: MenuState | null) {
  const root = createRoot();
  mounted.push(root);
  await act(async () => {
    root.render(<NativeMenu state={s} open={noop} choose={noop} restart={noop} close={noop} dismissed={noop} />);
  });
  return root;
}
const texts = (root: Awaited<ReturnType<typeof render>>) =>
  root.container.queryAll(i => i.type === 'Text').map(i => i.children.join(''));

describe('NativeMenu', () => {
  it('renders nothing while closed', async () => {
    expect((await render(null)).container.queryAll(i => i.type === 'Text')).toHaveLength(0);
  });

  it('renders the entries, the close button label and no footer', async () => {
    const root = await render(state);
    const all = texts(root).map(t => t.replace(/\u00ad/g, ''));
    expect(all).toEqual(expect.arrayContaining(['Menü', '01 · Du bist hier', 'Bundestag Wrapped', 'Abgeordnete-Wrapped', 'Neu starten']));
    expect(all.join(' ')).not.toMatch(/Wahlperiode|Datenschutz/);
    const close = root.container.queryAll(i => i.props.accessibilityLabel === 'Menü schließen');
    expect(close.length).toBeGreaterThan(0);
  });

  it('announces the active card once (label suffix, no selected state)', async () => {
    const root = await render(state);
    const active = root.container.queryAll(i => i.props.accessibilityLabel === 'Bundestag Wrapped, aktuelle Seite')[0];
    expect(active.props.accessibilityState?.selected).toBeFalsy();
  });

  const fullState: MenuState = {
    ...state,
    entries: [
      state.entries[0],
      state.entries[1],
      { ...state.entries[2], tile: false },
      state.entries[3],
    ],
  };
  const atWidth = (width: number) => jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 3, fontScale: 1 });

  it.each([402, 768])('wraps Wrapped between words, no soft hyphen (%i pt)', async width => {
    atWidth(width);
    const t = texts(await render(fullState));
    expect(t).toContain('Bundestag Wrapped');
    expect(t).toContain('Abgeordnete-Wrapped');
    jest.restoreAllMocks();
  });

  it('hyphenates PERFECT in the half tile when it cannot fit (phone)', async () => {
    atWidth(402);
    const title = texts(await render(fullState)).find(t => t.replace(/\u00ad/g, '') === 'Perfect Match');
    expect(title).toBe('Per\u00adfect Match');
    jest.restoreAllMocks();
  });

  it('hides the restart pill without canRestart', async () => {
    expect(texts(await render({ ...state, canRestart: false }))).not.toContain('Neu starten');
  });

  it('survives an unknown colour at render time', async () => {
    const bad = { ...state, entries: [{ ...state.entries[0], color: 'teal' as never }] };
    await expect(render(bad)).resolves.toBeDefined();
  });
});
