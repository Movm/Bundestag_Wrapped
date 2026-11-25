import { describe, expect, it } from 'vitest';
import { random } from './random';

describe('random', () => {
  it('is deterministic per seed', () => {
    const a = random(2026), b = random(2026);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('matches the values the web cover used before the move', () => {
    const r630 = random(630);
    expect([r630(), r630(), r630()]).toEqual([0.3380361092276871, 0.37997926608659327, 0.2513335661496967]);
    expect(random(2026)()).toBe(0.45540769933722913);
    expect(random(17)()).toBe(0.6771502960473299);
  });
});
