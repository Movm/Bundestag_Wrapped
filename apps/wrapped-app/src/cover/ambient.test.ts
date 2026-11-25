import { random } from '../../../wrapped/src/shared/cover/random';
import {
  addFlight, alternateProgress, blinkOpacity, buildStars, cssRadii, FLYERS, flyerPivot, glowColors, glowMotion, GLOWS,
  makeFlight, makeShot, planetMotion, sampleFlight, sampleShot, STAR_LAYERS, starLayerOpacity, steps2, trailMotion, wobbleMotion,
} from './ambient';

describe('buildStars', () => {
  const box = { width: 402, height: 874 };
  const layers = buildStars(box);
  it('draws 140 / 60 / 18 stars of 1.5 / 2 / 3 px', () => {
    expect(layers.map(l => l.length)).toEqual([140, 60, 18]);
    expect(layers.map(l => l[0].r * 2)).toEqual([1.5, 2, 3]);
  });
  it('takes colour, alpha, x, y from one random(2026) across the layers, over the box + 40 px each side', () => {
    const rand = random(2026);
    const [c, a, x, y] = [rand(), rand(), rand(), rand()];
    const first = layers[0][0];
    expect(first.color).toBe(STAR_LAYERS[0].colors[Math.floor(c * 2)]);
    expect(first.alpha).toBeCloseTo(0.18 + a * 0.2, 12);
    expect(first.x).toBeCloseTo(x * 482 - 40, 9);
    expect(first.y).toBeCloseTo(y * 954 - 40, 9);
    // The second layer continues the same generator after 140 · 4 draws.
    for (let i = 4; i < 140 * 4; i++) rand();
    const [c2, a2, x2, y2] = [rand(), rand(), rand(), rand()];
    expect(layers[1][0]).toEqual({ x: x2 * 482 - 40, y: y2 * 954 - 40, r: 1, color: STAR_LAYERS[1].colors[Math.floor(c2 * 3)], alpha: 0.35 + a2 * 0.25 });
  });
  it('keeps every star inside its alpha range and the overscanned box', () => {
    layers.forEach((layer, i) => layer.forEach(s => {
      expect(s.alpha).toBeGreaterThanOrEqual(STAR_LAYERS[i].alpha[0]);
      expect(s.alpha).toBeLessThan(STAR_LAYERS[i].alpha[1]);
      expect(s.x).toBeGreaterThanOrEqual(-40);
      expect(s.x).toBeLessThan(442);
    }));
  });
});

describe('starLayerOpacity', () => {
  it('fades layer i in over 1200 ms after i·250 with ease-out', () => {
    expect(starLayerOpacity(0, 0)).toBe(0);
    expect(starLayerOpacity(2, 499)).toBe(0);
    expect(starLayerOpacity(0, 600)).toBeCloseTo(0.6846, 3);
    expect(starLayerOpacity(2, 1700)).toBe(1);
  });
});

describe('loop helpers', () => {
  it('alternates and is −1 while stopped or delayed', () => {
    expect(alternateProgress(-1, 1000)).toBe(-1);
    expect(alternateProgress(50, 1000, 100)).toBe(-1);
    expect(alternateProgress(250, 1000)).toBeCloseTo(0.25, 9);
    expect(alternateProgress(1250, 1000)).toBeCloseTo(0.75, 9);
    expect(alternateProgress(2250, 1000)).toBeCloseTo(0.25, 9);
  });
  it('steps(2) jumps at the half (README table: 0, 0, .5, .5, .5)', () => {
    expect([0.1, 0.25, 0.5, 0.75, 0.9].map(steps2)).toEqual([0, 0, 0.5, 0.5, 0.5]);
    expect(steps2(1)).toBe(1);
  });
  it('blinks between 1 and .575 (steps(2) never rests on .15) and is 1 when stopped', () => {
    expect(blinkOpacity(-1)).toBe(1);
    expect(blinkOpacity(100)).toBe(1);
    expect(blinkOpacity(400)).toBeCloseTo(0.575, 9);
    expect(blinkOpacity(800)).toBeCloseTo(0.575, 9);
    expect(blinkOpacity(1100)).toBe(1);
  });
  it('pulses the trail with a 120 ms offset per dot', () => {
    expect(trailMotion(2, 200)).toEqual({ opacity: 1, scale: 1 });
    expect(trailMotion(0, 360)).toEqual({ opacity: 0.25, scale: 0.5 });
    expect(trailMotion(1, 120 + 360)).toEqual({ opacity: 0.25, scale: 0.5 });
  });
  it('wobbles the UFO from −4 px / −8° to 4 px / 8°', () => {
    expect(wobbleMotion(0)).toEqual({ ty: -4, rotate: -8 });
    expect(wobbleMotion(600)).toEqual({ ty: 4, rotate: 8 });
    expect(wobbleMotion(-1)).toEqual({ ty: 0, rotate: 0 });
  });
});

describe('glows and planet', () => {
  it('uses the cover.css stops with a transparent edge in the same colour', () => {
    expect(glowColors(GLOWS[0])).toEqual(['rgba(123,63,242,0.13)', 'rgba(123,63,242,0.05)', 'rgba(123,63,242,0)']);
    expect(GLOWS.map(g => g.duration)).toEqual([17_000, 13_000, 19_000]);
  });
  it('drifts to the target at the end of the first iteration and back after the second', () => {
    expect(glowMotion(GLOWS[1], 13_000, 4.02, 8.74)).toEqual({ tx: 7 * 4.02, ty: 6 * 8.74, scale: 0.9 });
    expect(glowMotion(GLOWS[1], 26_000, 4.02, 8.74).scale).toBeCloseTo(1, 9);
    expect(glowMotion(GLOWS[0], -1, 4, 8)).toEqual({ tx: 0, ty: 0, scale: 1 });
  });
  it('bobs the planet up 14 px and 6° over 7 s', () => {
    expect(planetMotion(7000)).toEqual({ ty: -14, rotate: 6 });
    expect(planetMotion(3500).ty).toBeCloseTo(-7, 6);
  });
});

describe('cssRadii', () => {
  it('scales all corners by the smallest factor, as CSS does', () => {
    const [tl, tr, br, bl] = cssRadii(62, 10, [3, 999, 999, 3]);
    expect(tr).toBeCloseTo(5, 9);
    expect(br).toBeCloseTo(5, 9);
    expect(tl).toBeLessThan(0.02);
    expect(bl).toBeLessThan(0.02);
    expect(cssRadii(18, 12, [999, 999, 0, 0])).toEqual([9, 9, 0, 0]);
    expect(cssRadii(24, 14, [2, 2, 2, 2])).toEqual([2, 2, 2, 2]);
  });
});

describe('flights', () => {
  it('pivots the rocket around the centre of the shrunk .cv-fly box', () => {
    expect(flyerPivot(FLYERS.rocket)).toEqual({ x: 15, y: 6 });
    expect(flyerPivot(FLYERS.satellite)).toEqual({ x: 13, y: 2 });
  });
  it('flies at the speed of cover.ts and points the rocket along its path', () => {
    const rocket = makeFlight('rocket', { x1: -70, y1: 160.8, x2: 270.3, y2: -70 }, 0);
    expect(rocket.duration).toBeCloseTo(1713, 0); // README: 1713 ms
    expect(rocket.angle).toBeCloseTo(Math.atan2(-230.8, 340.3), 12);
    expect(makeFlight('ufo', { x1: 0, y1: 0, x2: 420, y2: 0 }, 0)).toMatchObject({ duration: 1000, angle: 0 });
    expect(makeFlight('satellite', { x1: 0, y1: 0, x2: 350, y2: 0 }, 0).duration).toBe(10_000);
  });
  it('samples with the effect easing, only while active, the newest flight winning', () => {
    const a = makeFlight('satellite', { x1: 0, y1: 0, x2: 350, y2: 0 }, 0);
    expect(sampleFlight('satellite', [a], 5000)).toEqual({ x: 175, y: 0, angle: 0 });
    expect(sampleFlight('satellite', [a], 10_000)).toBeNull();
    expect(sampleFlight('satellite', [a], -1)).toBeNull();
    const b = makeFlight('satellite', { x1: 1000, y1: 0, x2: 1035, y2: 0 }, 2000);
    expect(sampleFlight('satellite', [a, b], 2500)?.x).toBeCloseTo(1017.5, 9);
    // b has ended, a still runs: a shows again, as on the web.
    expect(sampleFlight('satellite', [a, b], 3500)?.x).toBeCloseTo(122.5, 9);
    const r = makeFlight('rocket', { x1: 0, y1: 0, x2: 240, y2: 0 }, 0);
    expect(sampleFlight('rocket', [r], 250)?.x).toBeCloseTo(240 * 0.1137, 1);
  });
  it('drops ended flights when a new one starts', () => {
    const a = { start: 0, duration: 100 }, b = { start: 50, duration: 100 }, c = { start: 120, duration: 10 };
    expect(addFlight([a, b], c, 120)).toEqual([b, c]);
  });
});

describe('sampleShot', () => {
  it('fades in to 1 at 25 % of the eased progress, travels d·(.91,.41), fades out', () => {
    const shot = makeShot({ x: 100, y: 50, d: 300 }, 1000);
    expect(sampleShot([shot], 999)).toBeNull();
    expect(sampleShot([shot], 1000)).toEqual({ x: 100, y: 50, opacity: 0 });
    const mid = sampleShot([shot], 1450)!;
    expect(mid.opacity).toBeCloseTo((1 - 0.5) / 0.75, 3);
    expect(mid.x).toBeCloseTo(100 + 300 * 0.91 * 0.5, 3);
    expect(sampleShot([shot], 1900)).toBeNull();
  });
});
