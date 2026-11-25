/**
 * Pure motion helpers for the native cover: CSS cubic-bezier, WAAPI-style keyframe
 * sampling and the timings from cover.ts. Everything is a worklet and free of
 * React Native / Reanimated imports, so it also runs in plain Jest.
 */
import { buildSeats, type Seat } from '../../../wrapped/src/shared/cover/seats';
import { random } from '../../../wrapped/src/shared/cover/random';

export type Easing = (t: number) => number;

export interface Frame {
  offset: number;
  tx?: number;
  ty?: number;
  scale?: number;
  opacity?: number;
  /** Degrees. */
  rotate?: number;
  /** Easing of the segment that starts at this frame (CSS `easing` on a keyframe). */
  easing?: Easing;
}

export interface Sample {
  tx: number;
  ty: number;
  scale: number;
  opacity: number;
  /** Degrees. */
  rotate: number;
}

/** Same as CSS `cubic-bezier(x1, y1, x2, y2)`: Newton iteration, bisection as fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  'worklet';
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (t: number) => {
    'worklet';
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const err = ((ax * s + bx) * s + cx) * s - t;
      if (Math.abs(err) < 1e-7) return ((ay * s + by) * s + cy) * s;
      const slope = (3 * ax * s + 2 * bx) * s + cx;
      if (Math.abs(slope) < 1e-6) break;
      s -= err / slope;
    }
    let lo = 0, hi = 1;
    s = t;
    for (let i = 0; i < 40; i++) {
      const x = ((ax * s + bx) * s + cx) * s;
      if (Math.abs(x - t) < 1e-7) break;
      if (x < t) lo = s; else hi = s;
      s = (lo + hi) / 2;
    }
    return ((ay * s + by) * s + cy) * s;
  };
}

export const EASE_IN = cubicBezier(0.2, 1.25, 0.4, 1);
export const EASE_IN_OUT = cubicBezier(0.42, 0, 0.58, 1);
export const EASE_OUT = cubicBezier(0, 0, 0.58, 1);
export const EASE_EXIT_TEXT = cubicBezier(0.6, 0, 0.8, 0.4);
export const EASE_SEED_POP = cubicBezier(0.2, 1.4, 0.4, 1);
export const EASE_WIPE = cubicBezier(0.75, 0, 0.2, 1);

/**
 * Samples a keyframe list like WAAPI. The effect easing distorts `progress` first (the
 * result may leave [0, 1] for overshooting curves); the segment is chosen on the clamped
 * value, the local fraction uses the distorted one, so the last (first) segment is
 * extrapolated. The easing of the earlier frame of the pair shapes the fraction.
 * Opacity is clamped to [0, 1]; translate and scale pass overshoot through.
 */
export function sampleKeyframes(frames: Frame[], progress: number, effectEasing?: Easing): Sample {
  'worklet';
  const clamped = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const p = effectEasing ? effectEasing(clamped) : clamped;
  const pc = p < 0 ? 0 : p > 1 ? 1 : p;
  let i = 0;
  while (i < frames.length - 2 && pc >= frames[i + 1].offset) i++;
  const a = frames[i], b = frames[Math.min(i + 1, frames.length - 1)];
  const span = b.offset - a.offset;
  let f = span > 0 ? (p - a.offset) / span : 1;
  if (a.easing && f > 0 && f < 1) f = a.easing(f);
  const mix = (from: number, to: number) => from + (to - from) * f;
  const opacity = mix(a.opacity ?? 1, b.opacity ?? 1);
  return {
    tx: mix(a.tx ?? 0, b.tx ?? 0),
    ty: mix(a.ty ?? 0, b.ty ?? 0),
    scale: mix(a.scale ?? 1, b.scale ?? 1),
    opacity: opacity < 0 ? 0 : opacity > 1 ? 1 : opacity,
    rotate: mix(a.rotate ?? 0, b.rotate ?? 0),
  };
}

/** Milliseconds, verbatim from cover.ts. */
export const COVER_TIMING = {
  seedPulse: 650,
  seatDuration: 1300,
  seatDelayBase: 500,
  seatDelayT: 260,
  seatDelayRow: 14,
  seatDelayJitter: 40,
  entranceDuration: 700,
  titleDelay: 1350,
  wrappedDelay: 1430,
  yearDelay: 1600,
  buttonDelay: 1650,
  eagleDelay: 1250,
  starLayerDuration: 1200,
  starLayerStagger: 250,
  waveStart: 3700,
  wavePeriod: 10_000,
  waveDelayT: 1800,
  waveDelayRow: 40,
  exitTextDuration: 380,
  exitTextStagger: 30,
  exitSeatDuration: 1000,
  exitSeatRow: 30,
  exitSeatT: 160,
  exitSeatJitter: 50,
  seedPopStart: 1200,
  seedPopDuration: 380,
  wipeStart: 1500,
  wipeDuration: 750,
  exitDone: 2280,
} as const;

export interface StageGeometry { width: number; height: number; cx: number; cy: number }
export interface SeatTrack { delay: number; duration: number; frames: Frame[] }

const SEAT_BUILD = cubicBezier(0.05, 0.9, 0.3, 1);
const SEAT_SETTLE = cubicBezier(0.65, 0, 0.25, 1);
const SEAT_EXIT = cubicBezier(0.7, 0, 0.25, 1);

/** Seats fly out of the centre, overshoot to a scattered point, then settle. PRNG 630: angle, distance, jitter per seat. */
export function assemblyPlan(geometry: StageGeometry, seats: Seat[] = buildSeats()): SeatTrack[] {
  'worklet';
  const { width, cx, cy, height } = geometry;
  const rand = random(630);
  return seats.map(seat => {
    const px = seat.x / 100 * width, py = seat.y / 100 * height;
    const angle = rand() * Math.PI * 2, distance = width * (0.15 + rand() * 0.45);
    const sx = cx + Math.cos(angle) * distance - px, sy = cy + Math.sin(angle) * distance * 0.7 - py;
    return {
      delay: COVER_TIMING.seatDelayBase + seat.t * COVER_TIMING.seatDelayT + seat.row * COVER_TIMING.seatDelayRow + rand() * COVER_TIMING.seatDelayJitter,
      duration: COVER_TIMING.seatDuration,
      frames: [
        { offset: 0, tx: cx - px, ty: cy - py, scale: 0, easing: SEAT_BUILD },
        { offset: 0.34, tx: sx, ty: sy, scale: 1.3, easing: SEAT_SETTLE },
        { offset: 1, tx: 0, ty: 0, scale: 1 },
      ],
    };
  });
}

/** Seats fall into the centre. PRNG 17: one value per seat. */
export function exitPlan(geometry: StageGeometry, seats: Seat[] = buildSeats()): SeatTrack[] {
  'worklet';
  const { width, height, cx, cy } = geometry;
  const rand = random(17);
  return seats.map(seat => {
    const dx = cx - seat.x / 100 * width, dy = cy - seat.y / 100 * height;
    return {
      delay: (9 - seat.row) * COVER_TIMING.exitSeatRow + Math.abs(seat.t - 0.5) * COVER_TIMING.exitSeatT + rand() * COVER_TIMING.exitSeatJitter,
      duration: COVER_TIMING.exitSeatDuration,
      frames: [
        { offset: 0, tx: 0, ty: 0, scale: 1 },
        { offset: 0.3, tx: -dx * 0.12, ty: -dy * 0.12, scale: 1.4, easing: SEAT_EXIT },
        { offset: 1, tx: dx, ty: dy, scale: 0.8 },
      ],
    };
  });
}

// Before `wavePlan`: worklet closures capture their free variables where they are defined.
const WAVE_FRAMES: Frame[] = [
  { offset: 0, scale: 1 },
  { offset: 0.07, scale: 1.25 },
  { offset: 0.14, scale: 1 },
  { offset: 1, scale: 1 },
];

/** Idle wave, looping every `COVER_TIMING.wavePeriod` with the effect easing `EASE_IN_OUT`. */
export function wavePlan(seats: Seat[] = buildSeats()): SeatTrack[] {
  'worklet';
  return seats.map(seat => ({
    delay: seat.t * COVER_TIMING.waveDelayT + seat.row * COVER_TIMING.waveDelayRow,
    duration: COVER_TIMING.wavePeriod,
    frames: WAVE_FRAMES,
  }));
}

/** DOM order of `[data-in], .cv-eagle` on exit; the stagger is `index * exitTextStagger`. */
export const exitTextOrder = ['eagle', 'bundestag', 'wrapped', 'year', 'button'] as const;

/** Wipe circle radii: starts at 3 % of the stage width, ends past the farthest screen corner (+20). */
export function wipeRadii(centre: { x: number; y: number }, stageWidth: number, screen: { width: number; height: number }): { start: number; end: number } {
  'worklet';
  return {
    start: stageWidth * 0.03,
    end: Math.hypot(Math.max(centre.x, screen.width - centre.x), Math.max(centre.y, screen.height - centre.y)) + 20,
  };
}

/**
 * Iteration progress (0 ≤ p < 1) of one seat's idle wave, `elapsed` ms after the wave started
 * (`COVER_TIMING.waveStart` into the assembly). The web runs it with `iterations: Infinity` and no
 * fill, so before the seat's delay it is −1 (the seat rests) and after it wraps every `period`.
 */
export function waveProgress(elapsed: number, delay: number, period: number): number {
  'worklet';
  const local = elapsed - delay;
  if (elapsed < 0 || local < 0) return -1;
  return (local % period) / period;
}

/** The ambient loops of `startAmbient()` in cover.ts, ms. */
export const AMBIENT_LOOPS = {
  shootingStar: { min: 5000, max: 10_000 },
  rocket: { min: 9000, max: 15_000 },
  ufo: { min: 15_000, max: 24_000 },
  satellite: { min: 24_000, max: 36_000 },
} as const;

export type AmbientLoop = keyof typeof AMBIENT_LOOPS;

/**
 * cover.ts `loop(fn, min, max)`: the first run is `min * 0.4` after the ambient layer starts, and
 * every run schedules the next one `min + rand() * (max - min)` after itself. Times in ms on any
 * common clock; `next` draws exactly one value from `rand` (`Math.random`, as on the web).
 */
export function ambientSchedule(rand: () => number) {
  const first = {} as Record<AmbientLoop, number>;
  for (const loop of Object.keys(AMBIENT_LOOPS) as AmbientLoop[]) first[loop] = AMBIENT_LOOPS[loop].min * 0.4;
  return {
    first,
    next(loop: AmbientLoop, ranAt: number): number {
      const { min, max } = AMBIENT_LOOPS[loop];
      return ranAt + min + rand() * (max - min);
    },
  };
}

/** Offset from which every later wave keyframe is at rest (scale 1, no translate): 0.14. */
function waveRestOffset(frames: Frame[]): number {
  const rests = (f: Frame) => (f.scale ?? 1) === 1 && !f.tx && !f.ty;
  let i = frames.length - 1;
  while (i > 0 && rests(frames[i - 1])) i--;
  return frames[i].offset;
}

/** Smallest raw progress whose `EASE_IN_OUT` value reaches `target` (bisection; the curve is monotone). */
function invertEasing(easing: Easing, target: number): number {
  let lo = 0, hi = 1;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (easing(mid) >= target) hi = mid; else lo = mid;
  }
  return hi;
}

/**
 * Raw iteration progress from which a seat rests until the period ends: the effect easing
 * (`ease-in-out`) inverted at the rest offset of the keyframes (≈ 0.26, i.e. ≈ 2.6 s of 10 s).
 */
export const WAVE_REST_PROGRESS = invertEasing(EASE_IN_OUT, waveRestOffset(WAVE_FRAMES));

/** Clock value meaning "every seat rests": distinct from −1 (no wave), so the seats keep the rest pose. */
export const WAVE_RESTING = -2;

/**
 * Phase window (ms within each period, measured from the wave start) in which every seat rests:
 * from the rest point of the seat with the longest delay to the end of the period.
 */
export function waveRestWindow(plan: SeatTrack[]): { from: number; to: number } {
  let longest = 0;
  for (const track of plan) longest = Math.max(longest, track.delay);
  return { from: WAVE_REST_PROGRESS * COVER_TIMING.wavePeriod + longest, to: COVER_TIMING.wavePeriod };
}

/**
 * The wave clock as the seats should see it: −1 before the wave, `WAVE_RESTING` while every seat
 * rests (one constant value, so the seat picture is not re-recorded every frame), else `waving`.
 */
export function waveClock(waving: number, window: { from: number; to: number }): number {
  'worklet';
  if (waving < 0) return -1;
  const phase = waving % COVER_TIMING.wavePeriod;
  return phase >= window.from && phase < window.to ? WAVE_RESTING : waving;
}

/** One seat's wave scale at wave clock `w` (≥ 0); skips the easing once the seat rests in its iteration. */
export function waveSeatScale(track: SeatTrack, w: number): number {
  'worklet';
  const p = waveProgress(w, track.delay, track.duration);
  if (p < 0 || p >= WAVE_REST_PROGRESS) return 1;
  return sampleKeyframes(track.frames, p, EASE_IN_OUT).scale;
}
