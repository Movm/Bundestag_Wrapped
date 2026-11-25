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

function setup() {
  const receive = jest.fn<void, [NativeToWeb]>();
  const hook = renderHook(() => useCoverBridge(receive));
  return { receive, hook };
}
const starts = (receive: jest.Mock) => receive.mock.calls.filter(([m]) => m.type === 'story.start').length;

describe('useCoverBridge', () => {
  beforeEach(() => { jest.useFakeTimers({ now: 1_000_000 }); });
  afterEach(() => { jest.useRealTimers(); });

  it('ignores unknown and malformed messages', () => {
    const { hook } = setup();
    const before = hook.result.current.state;
    act(() => {
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

  it('takes the year from a web.cover and stays showing', () => {
    const { hook } = setup();
    act(() => hook.result.current.onWebCover(cover(true)));
    expect(hook.result.current.state).toMatchObject({ year: 2026, webReady: true, phase: { name: 'showing' } });
  });

  it('a lost story.start never ends in "no cover, web still on its intro"', () => {
    const { receive, hook } = setup();
    act(() => hook.result.current.onWebCover(cover(true)));
    act(() => hook.result.current.press());
    act(() => { jest.advanceTimersByTime(COVER_TIMING.exitDone + 200); });
    expect(starts(receive)).toBe(1);
    // The web drops it and keeps reporting visible: true. First timeout: resend.
    act(() => { jest.advanceTimersByTime(CONFIRM_TIMEOUT + 200); });
    expect(starts(receive)).toBe(2);
    expect(hook.result.current.state.phase.name).toBe('handingOver');
    // Second timeout: the cover comes back, a fresh assembly.
    const run = hook.result.current.assemblyRun;
    act(() => { jest.advanceTimersByTime(CONFIRM_TIMEOUT + 200); });
    expect(hook.result.current.state.phase.name).toBe('showing');
    expect(hook.result.current.assemblyRun).toBe(run + 1);
    // And "Los geht's" works again.
    act(() => hook.result.current.press());
    expect(hook.result.current.state.phase.name).toBe('exiting');
  });
});
