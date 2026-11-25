import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetNativeShellForTesting, installNativeShell } from '@/lib/native-shell';
import type { WebToNative } from '@/shared/native-bridge/protocol';
import { MobileMenu } from './MobileMenu';

const clearWrappedProgress = vi.fn();
const resetQuiz = vi.fn();
vi.mock('@/lib/wrapped-storage', () => ({ clearWrappedProgress: (...a: unknown[]) => clearWrappedProgress(...a) }));
vi.mock('@/stores/quizStore', () => ({
  useQuizStore: (selector: (s: { reset: typeof resetQuiz }) => unknown) => selector({ reset: resetQuiz }),
}));

vi.mock('@/edition/EditionProvider', () => ({
  useOptionalEdition: () => ({
    editionId: '2026',
    manifest: { editionId: '2026', dataVersion: 'test', title: 'Bundestag Wrapped', year: 2026, assets: {} },
  }),
}));

window.matchMedia = ((query: string) => ({
  matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
})) as typeof window.matchMedia;

let container: HTMLDivElement;
let root: Root;
let sent: WebToNative[];
let receive: ReturnType<typeof installNativeShell>['receive'];
const onClose = vi.fn();
const onRestart = vi.fn();

function Probe() {
  const l = useLocation();
  return <output>{l.pathname + l.search + l.hash}</output>;
}

const pathname = () => container.querySelector('output')?.textContent;

async function mount(path: string, isOpen: boolean) {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Probe />
        <MobileMenu isOpen={isOpen} onClose={onClose} onRestart={onRestart} />
      </MemoryRouter>,
    ),
  );
}

beforeEach(() => {
  _resetNativeShellForTesting();
  sent = [];
  receive = installNativeShell((m) => sent.push(m)).receive;
  [clearWrappedProgress, resetQuiz, onClose, onRestart].forEach((f) => f.mockClear());
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  _resetNativeShellForTesting();
});

describe('MobileMenu in the native shell', () => {
  it('renders nothing and posts menu.open with canRestart on the story root, then closes', async () => {
    await mount('/2026', true);
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('[role=dialog]')).toBeNull();
    expect(sent).toHaveLength(1);
    const msg = sent[0];
    expect(msg.type).toBe('menu.open');
    if (msg.type !== 'menu.open') throw new Error('unreachable');
    expect(msg.canRestart).toBe(true);
    expect(msg.entries[0].href).toBe('/2026');
    expect(msg.entries.find((e) => e.label === 'MCP-Server')?.href).toMatch(/^https?:\/\//);
    expect(msg.footer.length).toBeGreaterThan(0);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not post while closed', async () => {
    await mount('/2026', false);
    expect(sent).toHaveLength(0);
  });

  it('posts canRestart false on /2026/abgeordnete', async () => {
    await mount('/2026/abgeordnete', true);
    const msg = sent[0];
    if (msg.type !== 'menu.open') throw new Error('unreachable');
    expect(msg.canRestart).toBe(false);
  });

  it('navigate from native changes the route; unsafe and non-app paths are ignored', async () => {
    await mount('/2026', false);
    await act(async () => receive({ type: 'navigate', href: '/2026/abgeordnete?x=1#h' }));
    expect(pathname()).toBe('/2026/abgeordnete?x=1#h');
    for (const href of ['//evil.com', 'https://x', '/dokumentation']) {
      await act(async () => receive({ type: 'navigate', href }));
      expect(pathname()).toBe('/2026/abgeordnete?x=1#h');
    }
  });

  it('restart from native clears progress, resets the quiz and calls onRestart', async () => {
    await mount('/2026', false);
    await act(async () => receive({ type: 'restart' }));
    expect(clearWrappedProgress).toHaveBeenCalledTimes(1);
    expect(resetQuiz).toHaveBeenCalledTimes(1);
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', async () => {
    await mount('/2026', false);
    await act(async () => root.render(null));
    await act(async () => receive({ type: 'restart' }));
    expect(onRestart).not.toHaveBeenCalled();
  });
});
