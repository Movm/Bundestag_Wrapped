import { AMBIENT_LOOPS, COVER_TIMING, EASE_IN_OUT, ambientSchedule, sampleKeyframes, waveProgress, wavePlan } from './coverMath';

/** Replays a fixed list of values and counts the draws. */
const fixed = (values: number[]) => {
  let i = 0;
  const rand = () => values[i++ % values.length];
  return { rand, draws: () => i };
};

describe('ambientSchedule', () => {
  it('uses the intervals of startAmbient() in cover.ts', () => {
    expect(AMBIENT_LOOPS).toEqual({
      shootingStar: { min: 5000, max: 10_000 },
      rocket: { min: 9000, max: 15_000 },
      ufo: { min: 15_000, max: 24_000 },
      satellite: { min: 24_000, max: 36_000 },
    });
  });
  it('runs each loop first after min * 0.4 (shooting star 2 s, rocket 3.6 s) without drawing a random value', () => {
    const { rand, draws } = fixed([0.5]);
    expect(ambientSchedule(rand).first).toEqual({ shootingStar: 2000, rocket: 3600, ufo: 6000, satellite: 9600 });
    expect(draws()).toBe(0);
  });
  it('schedules the next run min + rand * (max - min) after the run, one draw per call', () => {
    const { rand, draws } = fixed([0, 0.5, 0.25, 0.999]);
    const schedule = ambientSchedule(rand);
    expect(schedule.next('rocket', 3600)).toBe(3600 + 9000);
    expect(schedule.next('ufo', 6000)).toBe(6000 + 15_000 + 0.5 * 9000);
    expect(schedule.next('satellite', 9600)).toBe(9600 + 24_000 + 0.25 * 12_000);
    expect(schedule.next('shootingStar', 2000)).toBeCloseTo(2000 + 5000 + 0.999 * 5000, 6);
    expect(draws()).toBe(4);
  });
  it('always lands inside the interval', () => {
    const schedule = ambientSchedule(Math.random);
    for (const loop of Object.keys(AMBIENT_LOOPS) as (keyof typeof AMBIENT_LOOPS)[]) {
      for (let k = 0; k < 200; k++) {
        const gap = schedule.next(loop, 0);
        expect(gap).toBeGreaterThanOrEqual(AMBIENT_LOOPS[loop].min);
        expect(gap).toBeLessThan(AMBIENT_LOOPS[loop].max);
      }
    }
  });
});

describe('waveProgress (iteration wrap of the idle wave)', () => {
  const plan = wavePlan();
  const P = COVER_TIMING.wavePeriod;
  it('is −1 before the wave starts and before the seat delay (no fill: the seat rests)', () => {
    expect(waveProgress(-1, 0, P)).toBe(-1);
    expect(waveProgress(1799, 1800, P)).toBe(-1);
    expect(waveProgress(1800, 1800, P)).toBe(0);
  });
  it('wraps every period after the seat delay', () => {
    const delay = plan[629].delay; // t 1, row 9: 1800 + 360
    expect(delay).toBe(2160);
    expect(waveProgress(delay + 2500, delay, P)).toBeCloseTo(0.25, 9);
    expect(waveProgress(delay + P + 2500, delay, P)).toBeCloseTo(0.25, 9);
    expect(waveProgress(delay + 7 * P + 2500, delay, P)).toBeCloseTo(0.25, 9);
    expect(waveProgress(delay + P, delay, P)).toBe(0);
  });
  it('peaks at 1.25 about 1.9 s into each period, also in later iterations', () => {
    const delay = plan[0].delay; // seat 0: t 0, row 0
    expect(delay).toBe(0);
    for (const iteration of [0, 1, 5]) {
      const p = waveProgress(iteration * P + 1900, delay, P);
      expect(sampleKeyframes(plan[0].frames, p, EASE_IN_OUT).scale).toBeCloseTo(1.25, 1);
      const rest = waveProgress(iteration * P + 6000, delay, P);
      expect(sampleKeyframes(plan[0].frames, rest, EASE_IN_OUT).scale).toBe(1);
    }
  });
});
