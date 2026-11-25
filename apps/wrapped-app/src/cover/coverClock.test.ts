// No @types/node in this package: type just what the source check uses.
const { readFileSync, readdirSync } = require('fs') as { readFileSync(path: string, encoding: 'utf8'): string; readdirSync(path: string): string[] };
declare const __dirname: string;
import { clockValue, wipeDoneAt } from './coverClock';
import { COVER_TIMING } from './coverMath';

describe('coverClock', () => {
  it('counts from its wall-clock start, whatever happens in between (re-renders re-register the callback)', () => {
    const start = 10_000;
    // A frame at 11 200 reads 1200 no matter whether the callback was registered at 10 000 or 11 150.
    expect(clockValue(11_200, start, 2350)).toBe(1200);
    expect(clockValue(11_201, start, 2350)).toBe(1201);
  });
  it('is −1 without a start, 0 before it, and stops at its end (also after a long background stint)', () => {
    expect(clockValue(5000, -1, 2350)).toBe(-1);
    expect(clockValue(9990, 10_000, 2350)).toBe(0);
    expect(clockValue(70_000, 10_000, COVER_TIMING.exitDone)).toBe(COVER_TIMING.exitDone);
  });
  it('finishes the wipe before the machine hands over', () => {
    expect(wipeDoneAt(1000)).toBe(1000 + 2250);
    expect(wipeDoneAt(1000)).toBeLessThan(1000 + COVER_TIMING.exitDone);
  });
  it('no cover component reads timeSinceFirstFrame (it resets whenever Reanimated re-registers a callback)', () => {
    const offenders = readdirSync(__dirname)
      .filter(f => f.endsWith('.tsx'))
      .filter(f => readFileSync(`${__dirname}/${f}`, 'utf8').includes('timeSinceFirstFrame'));
    expect(offenders).toEqual([]);
  });
});
