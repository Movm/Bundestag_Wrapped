/**
 * The ambient layer of cover.ts / cover.css as data and pure motion: star layers, glows, planet,
 * flyers and the shooting star. Building (stars, radii) runs once per size on the JS thread; the
 * samplers are worklets that turn the ambient clock (ms since the layer started, −1 = stopped) into
 * transforms. No React Native imports, so it runs in plain Jest.
 */
import { random } from '../../../wrapped/src/shared/cover/random';
import { cubicBezier, EASE_IN_OUT, EASE_OUT, type Easing } from './coverMath';
import { progressAt } from './coverMotion';

export const SKY = {
  ink: '#0e0a14',
  pink: '#ff4fa0',
  violet: '#7b3ff2',
  deep: '#3a1670',
  lilac: '#b98cff',
  planetShadow: '#24103f',
  white: '#fff',
} as const;

/**
 * Whether the ambient layer may run for an `AppState`: only `background` and `inactive` count as away;
 * `unknown` (or no state yet, briefly at launch) counts as active, or the sky would wait for a change event.
 */
export function isAppActive(state: string | null | undefined): boolean {
  return state !== 'background' && state !== 'inactive';
}

// ─── Stars ──────────────────────────────────────────────────────────────

export interface StarLayerSpec { count: number; size: number; alpha: [number, number]; colors: string[]; glow: boolean }

/** `paintStars()` in cover.ts, in drawing order. */
export const STAR_LAYERS: StarLayerSpec[] = [
  { count: 140, size: 1.5, alpha: [0.18, 0.38], colors: [SKY.white, SKY.lilac], glow: false },
  { count: 60, size: 2, alpha: [0.35, 0.6], colors: [SKY.white, SKY.white, SKY.lilac], glow: false },
  { count: 18, size: 3, alpha: [0.55, 0.85], colors: [SKY.white, SKY.lilac, SKY.pink], glow: true },
];
/** `.cv-stars { inset: -2.5rem }`: each layer reaches 40 px past the cover on every side. */
export const STAR_OVERSCAN = 40;
/** Canvas `shadowBlur: 8` is a Gaussian with sigma = blur / 2. */
export const STAR_GLOW_SIGMA = 4;

export interface Star { x: number; y: number; r: number; color: string; alpha: number }

/**
 * All three layers from ONE `random(2026)`, layer after layer, four draws per star in the order
 * colour, alpha, x, y. Coordinates are in cover space (the layer origin is −40, −40).
 */
export function buildStars(box: { width: number; height: number }): Star[][] {
  const rand = random(2026);
  const w = box.width + 2 * STAR_OVERSCAN, h = box.height + 2 * STAR_OVERSCAN;
  return STAR_LAYERS.map(layer => {
    const stars: Star[] = [];
    for (let i = 0; i < layer.count; i++) {
      const color = layer.colors[Math.floor(rand() * layer.colors.length)];
      const alpha = layer.alpha[0] + rand() * (layer.alpha[1] - layer.alpha[0]);
      const x = rand() * w - STAR_OVERSCAN, y = rand() * h - STAR_OVERSCAN;
      stars.push({ x, y, r: layer.size / 2, color, alpha });
    }
    return stars;
  });
}

/** Star layer `i` fades in during the assembly: 1200 ms, delay i·250, `ease-out`, fill backwards only. */
export function starLayerOpacity(layer: number, assembly: number): number {
  'worklet';
  return EASE_OUT(progressAt(assembly, layer * 250, 1200));
}

// ─── Looping helpers ────────────────────────────────────────────────────

/**
 * Directed progress of an `iterations: Infinity, direction: 'alternate'` animation at clock `t`
 * (0 → 1, then 1 → 0, …), or −1 when stopped (`t < 0`) or still in its delay (no fill: at rest).
 */
export function alternateProgress(t: number, duration: number, delay = 0): number {
  'worklet';
  if (t < 0 || t < delay) return -1;
  const k = (t - delay) / duration;
  const iteration = Math.floor(k);
  const f = k - iteration;
  return iteration % 2 === 0 ? f : 1 - f;
}

/** CSS `steps(2)` (jump-end). */
export function steps2(p: number): number {
  'worklet';
  return p >= 1 ? 1 : Math.floor(p * 2) / 2;
}

// ─── Glows ──────────────────────────────────────────────────────────────

export interface GlowSpec {
  /** Centre as a fraction of the cover box. */
  left: number;
  top: number;
  /** Diameter in vmax. */
  size: number;
  rgb: [number, number, number];
  /** Alpha at the centre and at 55 %; transparent at the edge. */
  alpha: [number, number];
  /** Drift target: translate in vw / vh, scale. */
  drift: { x: number; y: number; scale: number };
  duration: number;
}

export const GLOWS: GlowSpec[] = [
  { left: 0.5, top: 0.48, size: 140, rgb: [123, 63, 242], alpha: [0.13, 0.05], drift: { x: -5, y: 3, scale: 1.1 }, duration: 17_000 },
  { left: 0.66, top: 0.26, size: 76, rgb: [255, 79, 160], alpha: [0.09, 0.03], drift: { x: 7, y: 6, scale: 0.9 }, duration: 13_000 },
  { left: 0.24, top: 0.78, size: 90, rgb: [58, 22, 112], alpha: [0.32, 0.12], drift: { x: 6, y: -5, scale: 1.15 }, duration: 19_000 },
];

/**
 * Gradient stops of `radial-gradient(closest-side, c0, c1 55%, transparent)`. CSS interpolates in
 * premultiplied space, so `transparent` behaves like the same colour at alpha 0.
 */
export function glowColors(glow: GlowSpec): string[] {
  const [r, g, b] = glow.rgb;
  return [`rgba(${r},${g},${b},${glow.alpha[0]})`, `rgba(${r},${g},${b},${glow.alpha[1]})`, `rgba(${r},${g},${b},0)`];
}
export const GLOW_POSITIONS = [0, 0.55, 1];

/** Drift of a glow at ambient clock `t` (ease-in-out, alternate); `vw`/`vh` are 1 % of the window. */
export function glowMotion(glow: GlowSpec, t: number, vw: number, vh: number): { tx: number; ty: number; scale: number } {
  'worklet';
  const p = alternateProgress(t, glow.duration);
  if (p < 0) return { tx: 0, ty: 0, scale: 1 };
  const e = EASE_IN_OUT(p);
  return { tx: glow.drift.x * vw * e, ty: glow.drift.y * vh * e, scale: 1 + (glow.drift.scale - 1) * e };
}

// ─── Planet ─────────────────────────────────────────────────────────────

/** The bob of `.cv-planet`: 7 s alternate, `translateY(-14px) rotate(6deg)`, around its centre. */
export function planetMotion(t: number): { ty: number; rotate: number } {
  'worklet';
  const p = alternateProgress(t, 7000);
  if (p < 0) return { ty: 0, rotate: 0 };
  const e = EASE_IN_OUT(p);
  return { ty: -14 * e, rotate: 6 * e };
}

/** Planet geometry in its own box (size × size): ring `::after` and the fixed inner shadow. */
export function planetGeometry(size: number) {
  return {
    /** Border box of the ring: left/right −38 %, top 39 %, height 22 %. Border 2 px inside it. */
    ring: { x: -0.38 * size, y: 0.39 * size, width: 1.76 * size, height: 0.22 * size },
    ringBorder: 2,
    ringRotate: -16,
    /** `box-shadow: inset -9px -7px 0` (fixed px, not proportional). */
    shadowOffset: { x: -9, y: -7 },
  };
}

// ─── Border radii (CSS clamping) ────────────────────────────────────────

/**
 * Corner radii as CSS resolves them: when two adjacent radii exceed their side, ALL radii shrink by
 * the smallest factor side / sum (css-backgrounds §5.5). The rocket body's `3px 999px 999px 3px` on
 * a 10 px box becomes ≈ 0 on the left and a half circle on the right.
 * Order: top-left, top-right, bottom-right, bottom-left.
 */
export function cssRadii(width: number, height: number, radii: [number, number, number, number]): [number, number, number, number] {
  const [tl, tr, br, bl] = radii;
  const f = Math.min(1, width / (tl + tr || 1), height / (tr + br || 1), width / (br + bl || 1), height / (bl + tl || 1));
  return [tl * f, tr * f, br * f, bl * f];
}

// ─── Flyer parts (trail, blink, wobble) ─────────────────────────────────

/** `[data-trail=i]`: 360 ms alternate, delay i·120, opacity 1 → .25, scale 1 → .5. */
export function trailMotion(i: number, t: number): { opacity: number; scale: number } {
  'worklet';
  const p = alternateProgress(t, 360, i * 120);
  if (p < 0) return { opacity: 1, scale: 1 };
  const e = EASE_IN_OUT(p);
  return { opacity: 1 - 0.75 * e, scale: 1 - 0.5 * e };
}

/** `[data-blink]`: 700 ms alternate, `steps(2)`, opacity 1 → .15. */
export function blinkOpacity(t: number): number {
  'worklet';
  const p = alternateProgress(t, 700);
  if (p < 0) return 1;
  return 1 - 0.85 * steps2(p);
}

/** `[data-wobble]` (UFO): 600 ms alternate, `translateY(-4px) rotate(-8deg)` → `translateY(4px) rotate(8deg)`. */
export function wobbleMotion(t: number): { ty: number; rotate: number } {
  'worklet';
  const p = alternateProgress(t, 600);
  // Without the animation the element has no transform at all.
  if (p < 0) return { ty: 0, rotate: 0 };
  const e = EASE_IN_OUT(p);
  return { ty: -4 + 8 * e, rotate: -8 + 16 * e };
}

// ─── Flights ────────────────────────────────────────────────────────────

export type FlyerKind = 'rocket' | 'ufo' | 'satellite';

export interface FlyerSpec {
  speed: number;
  easing: Easing;
  rotate: boolean;
  /** Size and negative margins of the markup root (`ROCKET`/`UFO`/`SAT` in cover.ts). */
  root: { width: number; height: number; marginTop: number; marginLeft: number };
}

const LINEAR: Easing = t => {
  'worklet';
  return t;
};

export const FLYERS: Record<FlyerKind, FlyerSpec> = {
  rocket: { speed: 240, easing: cubicBezier(0.4, 0, 0.8, 1), rotate: true, root: { width: 60, height: 24, marginTop: -12, marginLeft: -30 } },
  ufo: { speed: 420, easing: cubicBezier(0.7, 0, 0.3, 1), rotate: false, root: { width: 46, height: 22, marginTop: -11, marginLeft: -23 } },
  satellite: { speed: 35, easing: LINEAR, rotate: false, root: { width: 51, height: 9, marginTop: -5, marginLeft: -25 } },
};

/**
 * `.cv-fly` is absolutely positioned with an auto size, so it shrinks to its root's margin box:
 * (width + marginLeft) × (height + marginTop). Its transform origin (centre of that box) is the
 * pivot of the rocket's `rotate(angle)`.
 */
export function flyerPivot(spec: FlyerSpec): { x: number; y: number } {
  return { x: (spec.root.width + spec.root.marginLeft) / 2, y: (spec.root.height + spec.root.marginTop) / 2 };
}

export interface Flight { start: number; duration: number; x1: number; y1: number; x2: number; y2: number; angle: number }

/** One `fly()` of cover.ts on a free path, starting at ambient time `start`. */
export function makeFlight(kind: FlyerKind, path: { x1: number; y1: number; x2: number; y2: number }, start: number): Flight {
  const spec = FLYERS[kind];
  return {
    start,
    duration: Math.hypot(path.x2 - path.x1, path.y2 - path.y1) / spec.speed * 1000,
    ...path,
    angle: spec.rotate ? Math.atan2(path.y2 - path.y1, path.x2 - path.x1) : 0,
  };
}

/** Drops the flights that have ended, then adds `next` (several can overlap on one element). */
export function addFlight<T extends { start: number; duration: number }>(flights: T[], next: T, now: number): T[] {
  return [...flights.filter(f => f.start + f.duration > now), next];
}

/**
 * Position of a flyer at ambient time `t`. Like WAAPI without fill: only active flights count, and
 * the one created last wins. Null = not flying (the element sits at opacity 0).
 */
export function sampleFlight(kind: FlyerKind, flights: Flight[], t: number): { x: number; y: number; angle: number } | null {
  'worklet';
  if (t < 0) return null;
  for (let i = flights.length - 1; i >= 0; i--) {
    const f = flights[i];
    if (t < f.start || t >= f.start + f.duration) continue;
    const e = FLYERS[kind].easing((t - f.start) / f.duration);
    return { x: f.x1 + (f.x2 - f.x1) * e, y: f.y1 + (f.y2 - f.y1) * e, angle: f.angle };
  }
  return null;
}

// ─── Shooting star ──────────────────────────────────────────────────────

export const SHOOT = { width: 160, height: 2, duration: 900, angle: 24, easing: cubicBezier(0.3, 0, 0.7, 1) } as const;

export interface Shot { start: number; duration: number; x: number; y: number; d: number }

export function makeShot(at: { x: number; y: number; d: number }, start: number): Shot {
  return { start, duration: SHOOT.duration, ...at };
}

/**
 * `.cv-shoot` at ambient time `t`: opacity 0 → 1 (at 0.25) → 0 and `translate` along `d·(0.91, 0.41)`,
 * both on the progress after the effect easing. Null = not running.
 */
export function sampleShot(shots: Shot[], t: number): { x: number; y: number; opacity: number } | null {
  'worklet';
  if (t < 0) return null;
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    if (t < s.start || t >= s.start + s.duration) continue;
    const e = SHOOT.easing((t - s.start) / s.duration);
    const opacity = e <= 0.25 ? e / 0.25 : (1 - e) / 0.75;
    return { x: s.x + s.d * 0.91 * e, y: s.y + s.d * 0.41 * e, opacity: opacity < 0 ? 0 : opacity > 1 ? 1 : opacity };
  }
  return null;
}
