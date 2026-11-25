import { random } from '../../../wrapped/src/shared/cover/random';
import { blockedArea, freePath, shootingStarStart } from './flightPaths';

const box = { w: 402, h: 874 };
const stage = { x: -90, y: 168, width: 583, height: 303 };
const title = { x: 20, y: 502, width: 362, height: 200 };

describe('blockedArea', () => {
  const hit = blockedArea(stage, title, 50);
  it('blocks the hemicycle disc and the padded title, nothing else', () => {
    expect(hit(200, 460)).toBe(true);
    expect(hit(200, 600)).toBe(true);
    expect(hit(200, 20)).toBe(false);
  });
});

describe('freePath', () => {
  it('never crosses the blocked area', () => {
    const hit = blockedArea(stage, title, 50);
    const rand = random(1);
    for (let n = 0; n < 50; n++) {
      const path = freePath(box, hit, rand);
      if (!path) continue;
      expect(Math.hypot(path.x2 - path.x1, path.y2 - path.y1)).toBeGreaterThan(300);
      for (let k = 0; k <= 24; k++) expect(hit(path.x1 + (path.x2 - path.x1) * k / 24, path.y1 + (path.y2 - path.y1) * k / 24)).toBe(false);
    }
  });
  it('returns null when everything is blocked', () => {
    expect(freePath(box, () => true, random(2))).toBeNull();
  });
});

describe('shootingStarStart', () => {
  it('returns null when everything is blocked', () => {
    expect(shootingStarStart(box, () => true, random(3))).toBeNull();
  });
  it('finds a start whose whole stroke stays on screen on a wide box', () => {
    const s = shootingStarStart({ w: 1024, h: 1366 }, () => false, random(4));
    expect(s).not.toBeNull();
    expect(s!.x + (s!.d + 160) * 0.91).toBeLessThanOrEqual(1024);
    expect(s!.d).toBeGreaterThanOrEqual(260);
  });
});
