/**
 * When the native cover shows, when `story.start` goes out, and when the cover goes away.
 * A pure reducer: time comes only from `now`, so a wipe that ran out while the app sat in
 * the background is caught up by the next event (`appActive`) instead of a stopped JS timer.
 */
import { COVER_TIMING } from './coverMath';

/** After `story.start`, the web confirms by reporting `visible: false`; without it the cover goes anyway. */
export const CONFIRM_TIMEOUT = 3000;
/** Without any web message (no cover in the web: error page, offline, deep link), the cover goes after this. */
export const NO_WEB_TIMEOUT = 12_000;

export type CoverPhase =
  | { name: 'showing' }
  /** The wipe runs, from the press at `since`. */
  | { name: 'exiting'; since: number }
  /** The screen is pink. `since` is the moment `story.start` went out (or the wipe ended, while waiting for the web). */
  | { name: 'handingOver'; since: number; storyStartSent: boolean }
  | { name: 'hidden' };

export interface CoverState {
  phase: CoverPhase;
  /** The web shows its cover slide, so `story.start` lands. */
  webReady: boolean;
  /** Any `web.cover` arrived; switches off the 12 s fallback. */
  webSeen: boolean;
  year: number | null;
  muted: boolean;
  /** Fixed at creation (the OS setting). */
  reducedMotion: boolean;
  /** Time of the first event; the 12 s fallback counts from here. */
  startedAt: number | null;
}

export type CoverEvent =
  | { type: 'web.cover'; visible: boolean; year: number | null; muted?: boolean }
  | { type: 'press' }
  | { type: 'tick' }
  | { type: 'appActive' };

export type CoverEffect = 'playStartSound' | 'haptic' | 'sendStoryStart' | 'fadeOut' | 'startAssembly';

export function initialCoverState({ reducedMotion }: { reducedMotion: boolean }): CoverState {
  return { phase: { name: 'showing' }, webReady: false, webSeen: false, year: null, muted: false, reducedMotion, startedAt: null };
}

type Result = { state: CoverState; effects: CoverEffect[] };

const hide = (state: CoverState, effects: CoverEffect[]): Result =>
  ({ state: { ...state, phase: { name: 'hidden' }, webReady: false }, effects: [...effects, 'fadeOut'] });

/** The wipe is done (or skipped): send `story.start` now if the web can take it, else wait for it. */
function handOver(state: CoverState, now: number, effects: CoverEffect[]): Result {
  const sent = state.webReady;
  return {
    state: { ...state, phase: { name: 'handingOver', since: now, storyStartSent: sent } },
    effects: sent ? [...effects, 'sendStoryStart'] : effects,
  };
}

/** Applies what time alone decides. Runs before every event, so `tick` and `appActive` are the same. */
function advance(state: CoverState, now: number): Result {
  let result: Result = { state, effects: [] };
  const { phase } = result.state;
  if (phase.name === 'exiting' && now - phase.since >= COVER_TIMING.exitDone) result = handOver(result.state, now, []);
  const after = result.state.phase;
  if (after.name === 'handingOver' && after.storyStartSent && now - after.since >= CONFIRM_TIMEOUT) return hide(result.state, result.effects);
  if (after.name !== 'hidden' && !result.state.webSeen && now - (result.state.startedAt ?? now) >= NO_WEB_TIMEOUT) return hide(result.state, result.effects);
  return result;
}

function onWebCover(state: CoverState, event: Extract<CoverEvent, { type: 'web.cover' }>, now: number, effects: CoverEffect[]): Result {
  const next: CoverState = { ...state, webSeen: true, year: event.year, muted: event.muted ?? false };
  const { phase } = state;
  if (!event.visible) {
    // Showing: the web has no cover (or left it) → go without a wipe. Exiting: same.
    // Handing over: this is the confirmation (or the web never had a cover) → go.
    return phase.name === 'hidden' ? { state: next, effects } : hide(next, effects);
  }
  if (phase.name === 'hidden') {
    return { state: { ...next, phase: { name: 'showing' }, webReady: true }, effects: [...effects, 'startAssembly'] };
  }
  const ready = { ...next, webReady: true };
  if (phase.name === 'handingOver' && !phase.storyStartSent) return handOver(ready, now, effects);
  return { state: ready, effects };
}

function onPress(state: CoverState, now: number, effects: CoverEffect[]): Result {
  if (state.phase.name !== 'showing') return { state, effects };
  const feedback: CoverEffect[] = state.muted ? ['haptic'] : ['playStartSound', 'haptic'];
  if (state.reducedMotion) return handOver(state, now, [...effects, ...feedback]);
  return { state: { ...state, phase: { name: 'exiting', since: now } }, effects: [...effects, ...feedback] };
}

export function reduce(state: CoverState, event: CoverEvent, now: number): Result {
  const started = state.startedAt === null ? { ...state, startedAt: now } : state;
  const { state: current, effects } = advance(started, now);
  switch (event.type) {
    case 'web.cover':
      return onWebCover(current, event, now, effects);
    case 'press':
      return onPress(current, now, effects);
    case 'tick':
    case 'appActive':
      return { state: current, effects };
  }
}
