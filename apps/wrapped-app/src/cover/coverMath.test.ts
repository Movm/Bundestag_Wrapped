import { buildSeats } from '../../../wrapped/src/shared/cover/seats';
import { random } from '../../../wrapped/src/shared/cover/random';
import {
  COVER_TIMING, EASE_IN, EASE_IN_OUT, EASE_OUT, assemblyPlan, cubicBezier, exitPlan, exitTextOrder,
  sampleKeyframes, wavePlan, wipeRadii,
} from './coverMath';

const g = { width: 582.89, height: 303.09, cx: 582.89 / 2, cy: 303.09 * 0.55 };

// README section 2: [curve, y at 0.1, 0.25, 0.5, 0.75, 0.9]
const TABLE: [string, (t: number) => number, number[]][] = [
  ['.2,1.25,.4,1', cubicBezier(0.2, 1.25, 0.4, 1), [0.5011, 0.8713, 1.0169, 1.0114, 1.0022]],
  ['.05,.9,.3,1', cubicBezier(0.05, 0.9, 0.3, 1), [0.5981, 0.8319, 0.9581, 0.9934, 0.9992]],
  ['.65,0,.25,1', cubicBezier(0.65, 0, 0.25, 1), [0.0091, 0.0759, 0.6173, 0.9484, 0.9934]],
  ['.7,0,.25,1', cubicBezier(0.7, 0, 0.25, 1), [0.0078, 0.0637, 0.5667, 0.9472, 0.9933]],
  ['.6,0,.8,.4', cubicBezier(0.6, 0, 0.8, 0.4), [0.004, 0.0277, 0.1383, 0.4135, 0.7222]],
  ['.2,1.4,.4,1', cubicBezier(0.2, 1.4, 0.4, 1), [0.5526, 0.937, 1.0527, 1.0204, 1.0036]],
  ['.75,0,.2,1', cubicBezier(0.75, 0, 0.2, 1), [0.0068, 0.0556, 0.5802, 0.9534, 0.9941]],
  ['.3,0,.7,1', cubicBezier(0.3, 0, 0.7, 1), [0.0322, 0.1668, 0.5, 0.8332, 0.9678]],
  ['.4,0,.8,1', cubicBezier(0.4, 0, 0.8, 1), [0.0197, 0.1137, 0.3956, 0.7539, 0.942]],
  ['.7,0,.3,1', cubicBezier(0.7, 0, 0.3, 1), [0.0077, 0.0619, 0.5, 0.9381, 0.9923]],
  ['ease-in-out', EASE_IN_OUT, [0.0197, 0.1292, 0.5, 0.8708, 0.9803]],
  ['ease-out', EASE_OUT, [0.1606, 0.3781, 0.6846, 0.9065, 0.983]],
];

describe('cubicBezier', () => {
  it.each(TABLE)('matches the Chrome WAAPI reference for %s', (_name, fn, expected) => {
    [0.1, 0.25, 0.5, 0.75, 0.9].forEach((t, i) => expect(Math.abs(fn(t) - expected[i])).toBeLessThanOrEqual(0.001));
  });
  it('is 0 at 0 and 1 at 1', () => {
    expect(EASE_IN(0)).toBe(0);
    expect(EASE_IN(1)).toBe(1);
  });
});

describe('shared modules', () => {
  it('builds 630 seats in 10 rows', () => {
    const seats = buildSeats();
    expect(seats).toHaveLength(630);
    expect(new Set(seats.map(s => s.row)).size).toBe(10);
  });
  it('PRNG first values match the web', () => {
    expect(random(630)()).toBeCloseTo(0.3380361092276871, 15);
    expect(random(17)()).toBeCloseTo(0.6771502960473299, 15);
    expect(random(2026)()).toBeCloseTo(0.45540769933722913, 15);
  });
});

describe('sampleKeyframes', () => {
  it('applies the effect easing before choosing the segment (wave peak at t≈0.19)', () => {
    const frames = wavePlan()[0].frames;
    expect(sampleKeyframes(frames, 0.19, EASE_IN_OUT).scale).toBeCloseTo(1.25, 1);
    expect(sampleKeyframes(frames, 0.07, EASE_IN_OUT).scale).toBeLessThan(1.05);
    expect(sampleKeyframes(frames, 0.07).scale).toBeCloseTo(1.25, 5);
  });
  it('lets translate and scale overshoot but clamps opacity', () => {
    const frames = [{ offset: 0, scale: 0.5, opacity: 0 }, { offset: 1, scale: 1, opacity: 1 }];
    const s = sampleKeyframes(frames, 0.5, EASE_IN);
    expect(s.scale).toBeGreaterThan(1);
    expect(s.scale).toBeCloseTo(0.5 + 0.5 * 1.0169, 3);
    expect(s.opacity).toBe(1);
  });
  it('shapes a segment with the earlier frame easing', () => {
    const frames = [{ offset: 0, tx: 0, easing: EASE_OUT }, { offset: 1, tx: 100 }];
    expect(sampleKeyframes(frames, 0.5).tx).toBeCloseTo(68.46, 1);
  });
  it('mixes rotate in degrees and lets it overshoot with the effect easing (year pill pop)', () => {
    const frames = [{ offset: 0, rotate: -40, scale: 0, opacity: 0 }, { offset: 1, rotate: -6, scale: 1, opacity: 1 }];
    expect(sampleKeyframes(frames, 0).rotate).toBe(-40);
    expect(sampleKeyframes(frames, 1).rotate).toBe(-6);
    expect(sampleKeyframes(frames, 0.5, EASE_IN).rotate).toBeCloseTo(-40 + 34 * 1.0169, 2);
    expect(sampleKeyframes([{ offset: 0 }, { offset: 1 }], 0.5).rotate).toBe(0);
  });
});

describe('assemblyPlan', () => {
  const plan = assemblyPlan(g);
  it('starts every seat at the centre with scale 0 and ends in place', () => {
    expect(plan).toHaveLength(630);
    expect(sampleKeyframes(plan[0].frames, 0)).toMatchObject({ scale: 0 });
    expect(sampleKeyframes(plan[0].frames, 1)).toEqual({ tx: 0, ty: 0, scale: 1, opacity: 1, rotate: 0 });
    expect(sampleKeyframes(plan[629].frames, 1)).toEqual({ tx: 0, ty: 0, scale: 1, opacity: 1, rotate: 0 });
  });
  it('delays match cover.ts for seat 0 and seat 629', () => {
    expect(plan[0].delay).toBeCloseTo(510.0533, 3);
    expect(plan[629].delay).toBeCloseTo(896.6775, 3);
    expect(plan[0].duration).toBe(1300);
  });
  it('has the 0.34 keyframe at scale 1.3', () => {
    expect(plan[5].frames[1]).toMatchObject({ offset: 0.34, scale: 1.3 });
  });
});

describe('exitPlan', () => {
  const plan = exitPlan(g);
  it('delays match for seat 0 and seat 629', () => {
    expect(plan[0].delay).toBeCloseTo(383.8575, 3);
    expect(plan[629].delay).toBeCloseTo(82.0022, 3);
  });
  it('collapses to the centre at scale 0.8', () => {
    const seat = buildSeats()[0];
    const end = sampleKeyframes(plan[0].frames, 1);
    expect(end.scale).toBe(0.8);
    expect(end.tx).toBeCloseTo(g.cx - (seat.x / 100) * g.width, 6);
  });
  it('hands over at 2280 ms and staggers the texts in DOM order', () => {
    expect(COVER_TIMING.exitDone).toBe(2280);
    expect(exitTextOrder).toEqual(['eagle', 'bundestag', 'wrapped', 'year', 'button']);
  });
});

describe('wipeRadii', () => {
  it('starts at 3 % of the stage width and reaches the farthest corner + 20', () => {
    const r = wipeRadii({ x: 100, y: 200 }, 500, { width: 400, height: 800 });
    expect(r.start).toBeCloseTo(15, 6);
    expect(r.end).toBeCloseTo(Math.hypot(300, 600) + 20, 6);
  });
});
