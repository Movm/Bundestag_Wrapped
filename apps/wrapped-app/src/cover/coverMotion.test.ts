import { COVER_TIMING } from './coverMath';
import { ASSEMBLY_END, progressAt, sampleElement, seedScale, wipeProgress } from './coverMotion';

describe('coverMotion', () => {
  it('holds an entrance at its first frame until the delay (fill backwards), then rests at the end frame', () => {
    expect(sampleElement('bundestag', COVER_TIMING.titleDelay - 1, -1)).toMatchObject({ opacity: 0, ty: 50 });
    expect(sampleElement('bundestag', ASSEMBLY_END + 1000, -1)).toEqual({ tx: 0, ty: 0, scale: 1, opacity: 1, rotate: 0 });
    expect(sampleElement('year', ASSEMBLY_END, -1)).toMatchObject({ rotate: -6, scale: 1, opacity: 1 });
    expect(sampleElement('eagle', 0, -1)).toMatchObject({ opacity: 0, ty: -30, scale: 0.7, rotate: -8 });
  });
  it('overshoots the title rise with EASE_IN (translate passes 0, opacity clamps)', () => {
    const mid = sampleElement('wrapped', COVER_TIMING.wrappedDelay + COVER_TIMING.entranceDuration / 2, -1);
    expect(mid.ty).toBeCloseTo(50 - 50 * 1.0169, 2);
    expect(mid.opacity).toBe(1);
  });
  it('staggers the exit in DOM order: the eagle first, the button 120 ms later', () => {
    expect(sampleElement('eagle', 0, COVER_TIMING.exitTextDuration).opacity).toBe(0);
    expect(sampleElement('button', 0, COVER_TIMING.exitTextDuration).opacity).toBeGreaterThan(0);
    expect(sampleElement('button', 0, 4 * COVER_TIMING.exitTextStagger + COVER_TIMING.exitTextDuration)).toMatchObject({ opacity: 0, ty: 40, scale: 0.96, rotate: 0 });
  });
  it('pulses the seed to 0 on assembly and pops it to 2.2 on exit from 1200 ms', () => {
    expect(seedScale(0, -1)).toBe(0);
    expect(seedScale(COVER_TIMING.seedPulse, -1)).toBe(0);
    expect(seedScale(0, COVER_TIMING.seedPopStart - 1)).toBe(0);
    expect(seedScale(0, COVER_TIMING.seedPopStart + COVER_TIMING.seedPopDuration)).toBeCloseTo(2.2, 6);
  });
  it('runs the wipe from 1500 to 2250 ms', () => {
    expect(wipeProgress(COVER_TIMING.wipeStart)).toBe(0);
    expect(wipeProgress(COVER_TIMING.wipeStart + COVER_TIMING.wipeDuration / 2)).toBeCloseTo(0.5802, 3);
    expect(wipeProgress(COVER_TIMING.wipeStart + COVER_TIMING.wipeDuration)).toBe(1);
    expect(progressAt(5, 10, 10)).toBe(0);
  });
});
