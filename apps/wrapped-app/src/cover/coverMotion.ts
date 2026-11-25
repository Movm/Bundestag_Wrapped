/**
 * Keyframes of the cover elements other than the seats, verbatim from cover.ts
 * (ENTRANCES, the seed pulse and pop, the text exit), plus the clock → progress step.
 * Pure and worklet-safe like coverMath.
 */
import { COVER_TIMING, EASE_EXIT_TEXT, EASE_IN, EASE_IN_OUT, EASE_SEED_POP, EASE_WIPE, type Frame, sampleKeyframes, type Sample } from './coverMath';

/** `data-in="up"`: "Bundestag", "Wrapped", the button. */
export const ENTRANCE_UP: Frame[] = [{ offset: 0, opacity: 0, ty: 50 }, { offset: 1, opacity: 1 }];
/** The eagle: `translateY(-30px) scale(.7) rotate(-8deg)` → none. */
export const ENTRANCE_FLOAT: Frame[] = [{ offset: 0, opacity: 0, ty: -30, scale: 0.7, rotate: -8 }, { offset: 1, opacity: 1 }];
/** The year pill: `rotate(-40deg) scale(0)` → `rotate(-6deg) scale(1)`; its resting transform is the end frame. */
export const ENTRANCE_POP: Frame[] = [{ offset: 0, opacity: 0, rotate: -40, scale: 0 }, { offset: 1, opacity: 1, rotate: -6, scale: 1 }];
/**
 * Exit of the texts and the eagle: none → `translateY(40px) scale(.96)`, opacity 0. The animation
 * replaces the element's own transform, so the year pill loses its −6° here exactly as on the web.
 */
export const EXIT_TEXT: Frame[] = [{ offset: 0 }, { offset: 1, opacity: 0, ty: 40, scale: 0.96 }];

/** Seed pulse while assembling (650 ms, effect `ease-in-out`), ends at scale 0. */
export const SEED_PULSE: Frame[] = [
  { offset: 0, scale: 0 }, { offset: 0.25, scale: 1.5 }, { offset: 0.42, scale: 1 },
  { offset: 0.6, scale: 1.6 }, { offset: 0.75, scale: 1.1 }, { offset: 0.9, scale: 2.4 }, { offset: 1, scale: 0 },
];
/** Seed pop on exit (380 ms from 1200, effect `.2,1.4,.4,1`), stays at 2.2. */
export const SEED_POP: Frame[] = [{ offset: 0, scale: 0 }, { offset: 0.6, scale: 3 }, { offset: 1, scale: 2.2 }];

export type CoverElement = 'eagle' | 'bundestag' | 'wrapped' | 'year' | 'button';

/** Entrance per element: keyframes and delay (all 700 ms, effect EASE_IN). */
export const ENTRANCES: Record<CoverElement, { frames: Frame[]; delay: number }> = {
  eagle: { frames: ENTRANCE_FLOAT, delay: COVER_TIMING.eagleDelay },
  bundestag: { frames: ENTRANCE_UP, delay: COVER_TIMING.titleDelay },
  wrapped: { frames: ENTRANCE_UP, delay: COVER_TIMING.wrappedDelay },
  year: { frames: ENTRANCE_POP, delay: COVER_TIMING.yearDelay },
  button: { frames: ENTRANCE_UP, delay: COVER_TIMING.buttonDelay },
};

/** Exit stagger index: DOM order of `[data-in], .cv-eagle` (`exitTextOrder` in coverMath). */
export const EXIT_INDEX: Record<CoverElement, number> = { eagle: 0, bundestag: 1, wrapped: 2, year: 3, button: 4 };

/** The last entrance ends here; after it the assembly is at rest (the idle wave of Task 4 takes over at `waveStart`). */
export const ASSEMBLY_END = COVER_TIMING.buttonDelay + COVER_TIMING.entranceDuration;

/** Linear progress of an animation with `delay` and `duration` at clock `t`, clamped (fill both ways). */
export function progressAt(t: number, delay: number, duration: number): number {
  'worklet';
  const p = (t - delay) / duration;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

/**
 * One text element at assembly time `assembly` or, once `exit >= 0`, at exit time `exit`.
 * Without an exit the resting state is the entrance end frame.
 */
export function sampleElement(element: CoverElement, assembly: number, exit: number): Sample {
  'worklet';
  if (exit >= 0) {
    const p = progressAt(exit, EXIT_INDEX[element] * COVER_TIMING.exitTextStagger, COVER_TIMING.exitTextDuration);
    return sampleKeyframes(EXIT_TEXT, p, EASE_EXIT_TEXT);
  }
  const { frames, delay } = ENTRANCES[element];
  return sampleKeyframes(frames, progressAt(assembly, delay, COVER_TIMING.entranceDuration), EASE_IN);
}

/** Seed scale at assembly time `assembly` or, once `exit >= 0`, at exit time `exit`. */
export function seedScale(assembly: number, exit: number): number {
  'worklet';
  if (exit >= 0) {
    return sampleKeyframes(SEED_POP, progressAt(exit, COVER_TIMING.seedPopStart, COVER_TIMING.seedPopDuration), EASE_SEED_POP).scale;
  }
  return sampleKeyframes(SEED_PULSE, progressAt(assembly, 0, COVER_TIMING.seedPulse), EASE_IN_OUT).scale;
}

/** Wipe progress (0 → 1, effect `.75,0,.2,1`) at exit time `exit`; 0 before it starts. */
export function wipeProgress(exit: number): number {
  'worklet';
  return EASE_WIPE(progressAt(exit, COVER_TIMING.wipeStart, COVER_TIMING.wipeDuration));
}
