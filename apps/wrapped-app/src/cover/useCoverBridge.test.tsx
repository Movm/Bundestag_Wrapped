import { act, renderHook } from '@testing-library/react-native';
import { type NativeToWeb } from '../../../wrapped/src/shared/native-bridge/protocol';
import { COVER_TIMING } from './coverMath';
import { CONFIRM_TIMEOUT } from './coverMachine';
import { useCoverBridge } from './useCoverBridge';

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ volume: 1, play: jest.fn(), seekTo: jest.fn(() => Promise.resolve()) }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));
jest.mock('../../../wrapped/public/sounds/start.wav', () => 1, { virtual: true });

const cover = (visible: boolean, year: number | null = 2026) => ({ type: 'cover' as const, visible, year });

async function setup() {
  const receive = jest.fn<void, [NativeToWeb]>();
  const hook = await renderHook(() => useCoverBridge(receive));
  return { receive, hook };
}
const starts = (receive: jest.Mock) => receive.mock.calls.filter(([m]) => m.type === 'story.start').length;

describe('useCoverBridge', () => {
  beforeEach(() => { jest.useFakeTimers({ now: 1_000_000 }); });
  afterEach(() => { jest.useRealTimers(); });

  it('ignores unknown and malformed messages', async () => {
    const { hook } = await setup();
    const before = hook.result.current.state;
    await act(async () => {
      hook.result.current.onWebCover({ type: 'from-the-future' } as never);
      hook.result.current.onWebCover(undefined as never);
      hook.result.current.onWebCover(null as never);
      hook.result.current.onWebCover({} as never);
      hook.result.current.onWebCover({ type: 'cover' } as never);
      hook.result.current.onWebCover({ type: 'cover', visible: 'yes', year: 2026 } as never);
      hook.result.current.onWebCover({ type: 'cover', visible: true, year: '2026' } as never);
      hook.result.current.onWebCover({ type: 'cover', visible: true, year: 2026, muted: 1 } as never);
    });
    expect(hook.result.current.state).toBe(before);
  });

  it('a web that reports after the 12 s fallback does not make the cover flicker back', async () => {
    const { receive, hook } = await setup();
    await act(async () => { jest.advanceTimersByTime(12_200); });
    expect(hook.result.current.state.phase.name).toBe('hidden');
    const run = hook.result.current.assemblyRun;
    await act(async () => hook.result.current.onWebCover(cover(true)));
    expect(hook.result.current.state.phase.name).toBe('hidden');
    expect(hook.result.current.assemblyRun).toBe(run);
    expect(starts(receive)).toBe(1);
  });

  it('takes the year from a web.cover and stays showing', async () => {
    const { hook } = await setup();
    await act(async () => hook.result.current.onWebCover(cover(true)));
    expect(hook.result.current.state).toMatchObject({ year: 2026, webReady: true, phase: { name: 'showing' } });
  });

  it('a lost story.start never ends in "no cover, web still on its intro"', async () => {
    const { receive, hook } = await setup();
    await act(async () => hook.result.current.onWebCover(cover(true)));
    await act(async () => hook.result.current.press());
    await act(async () => { jest.advanceTimersByTime(COVER_TIMING.exitDone + 200); });
    expect(starts(receive)).toBe(1);
    // The web drops it and keeps reporting visible: true. First timeout: resend.
    await act(async () => { jest.advanceTimersByTime(CONFIRM_TIMEOUT + 200); });
    expect(starts(receive)).toBe(2);
    expect(hook.result.current.state.phase.name).toBe('handingOver');
    // Second timeout: the cover comes back, a fresh assembly.
    const run = hook.result.current.assemblyRun;
    await act(async () => { jest.advanceTimersByTime(CONFIRM_TIMEOUT + 200); });
    expect(hook.result.current.state.phase.name).toBe('showing');
    expect(hook.result.current.assemblyRun).toBe(run + 1);
    // And "Los geht's" works again.
    await act(async () => hook.result.current.press());
    expect(hook.result.current.state.phase.name).toBe('exiting');
  });
});
