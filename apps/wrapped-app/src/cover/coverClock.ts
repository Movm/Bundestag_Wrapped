/**
 * The cover's animation clocks, anchored to wall-clock start times (`Date.now()`, the clock the
 * machine uses) instead of a frame callback's `timeSinceFirstFrame`. Reanimated re-registers an
 * inline frame callback on every render and that resets `timeSinceFirstFrame` to 0; an anchored
 * clock does not care how often its callback is re-registered, it keeps counting across
 * re-renders and the background, and the exit runs on the press timestamp the machine hands over
 * from, so the wipe is complete (2250 ms) before story.start can go out (2280 ms).
 */
import { COVER_TIMING } from './coverMath';

/** Elapsed ms since `start`, capped at `end`; −1 while the clock has no start yet (`start < 0`). */
export function clockValue(now: number, start: number, end: number): number {
  'worklet';
  if (start < 0) return -1;
  const t = now - start;
  return t < 0 ? 0 : t > end ? end : t;
}

/** The moment the wipe has fully covered the screen for an exit that started at `since`. */
export function wipeDoneAt(since: number): number {
  return since + COVER_TIMING.wipeStart + COVER_TIMING.wipeDuration;
}
