/** Ambient paths: the blocked area, flyer paths and the shooting star, ported from cover.ts. */

export interface Rect { x: number; y: number; width: number; height: number }
export interface Box { w: number; h: number }
export type Blocked = (x: number, y: number) => boolean;

/** Rects are relative to the background box. Blocks the hemicycle disc and the title (+30 px). */
export function blockedArea(stage: Rect, title: Rect, pad: number): Blocked {
  'worklet';
  const ccx = stage.x + stage.width / 2, ccy = stage.y + stage.height * 0.96, radius = stage.width * 0.52 + pad;
  const tl = title.x - 30, tr = title.x + title.width + 30, tt = title.y - 30, tb = title.y + title.height + 30;
  return (x, y) => {
    'worklet';
    return Math.hypot(x - ccx, y - ccy) < radius || (x > tl && x < tr && y > tt && y < tb);
  };
}

export function freePath(box: Box, blocked: Blocked, rand: () => number): { x1: number; y1: number; x2: number; y2: number } | null {
  'worklet';
  const w = box.w, h = box.h, m = 70;
  const edge = (side: number): [number, number] => {
    const r = rand();
    if (side === 0) return [-m, r * h];
    if (side === 1) return [w + m, r * h];
    if (side === 2) return [r * w, -m];
    return [r * w, h + m];
  };
  for (let attempt = 0; attempt < 80; attempt++) {
    const a = Math.floor(rand() * 4), b = Math.floor(rand() * 4);
    if (a === b) continue;
    const [x1, y1] = edge(a), [x2, y2] = edge(b);
    let clear = Math.hypot(x2 - x1, y2 - y1) > 300;
    for (let k = 0; k <= 24 && clear; k++) clear = !blocked(x1 + (x2 - x1) * k / 24, y1 + (y2 - y1) * k / 24);
    if (clear) return { x1, y1, x2, y2 };
  }
  return null;
}

/** The web's `48rem` breakpoint: below it the stroke never fits (0 % at 402 px), so the loop is not scheduled at all. */
export const SHOOTING_STAR_MIN_WIDTH = 768;
export const hasShootingStar = (box: Box): boolean => box.w >= SHOOTING_STAR_MIN_WIDTH;

/** Start point and travel distance `d` (the path runs `d * (0.91, 0.41)`), or null. */
export function shootingStarStart(box: Box, blocked: Blocked, rand: () => number): { x: number; y: number; d: number } | null {
  'worklet';
  const w = box.w, h = box.h, d = 260 + rand() * 200, len = 160;
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = rand() * w, y = h * (0.04 + rand() * 0.7);
    let clear = true;
    for (let k = 0; k <= 8 && clear; k++) {
      const px = x + (d + len) * 0.91 * k / 8, py = y + (d + len) * 0.41 * k / 8;
      clear = !blocked(px, py) && px <= w;
    }
    if (clear) return { x, y, d };
  }
  return null;
}
