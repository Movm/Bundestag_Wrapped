import { coverLayout } from './coverLayout';

const none = { top: 0, bottom: 0 };

describe('coverLayout', () => {
  it('equals the web cover on 402×874 (iPhone 17 Pro)', () => {
    const l = coverLayout({ width: 402, height: 874 }, none);
    expect(l.minHeight).toBe(560);
    expect(l.padding.top).toBeCloseTo(20, 1);
    expect(l.padding.right).toBeCloseTo(20.1, 1);
    expect(l.padding.left).toBeCloseTo(20.1, 1);
    expect(l.padding.bottom).toBeCloseTo(24, 1);
    expect(l.stageWidth).toBeCloseTo(582.9, 1);
    expect(l.stageHeight).toBeCloseTo(303.09, 1);
    expect(l.gapStageTitle).toBeCloseTo(30.59, 2);
    expect(l.gapTitleButton).toBeCloseTo(52.44, 2);
    expect(l.titleSize).toBeCloseTo(52.26, 2);
    expect(l.button).toEqual({ height: 56, paddingX: 28, fontSize: 18 });
    expect(l.planet.size).toBe(52);
    expect(l.planet.left).toBe(28);
    expect(l.planet.top).toBeCloseTo(34.96, 2);
  });
  it('equals the web cover on 375×667', () => {
    const l = coverLayout({ width: 375, height: 667 }, none);
    expect(l.padding).toMatchObject({ top: 20, right: 20, bottom: 24, left: 20 });
    expect(l.stageWidth).toBeCloseTo(512.64, 2);
    expect(l.stageHeight).toBeCloseTo(266.56, 1);
    expect(l.gapStageTitle).toBeCloseTo(23.345, 2);
    expect(l.gapTitleButton).toBeCloseTo(40.02, 2);
    expect(l.titleSize).toBeCloseTo(48.75, 2);
    expect(l.button).toEqual({ height: 56, paddingX: 28, fontSize: 18 });
    expect(l.planet.top).toBeCloseTo(26.68, 2);
  });
  it('equals the web cover on 1024×1366', () => {
    const l = coverLayout({ width: 1024, height: 1366 }, none);
    expect(l.padding.top).toBeCloseTo(30.72, 2);
    expect(l.padding.right).toBeCloseTo(51.2, 2);
    expect(l.padding.bottom).toBeCloseTo(30.72, 2);
    expect(l.stageWidth).toBe(1100);
    expect(l.stageHeight).toBe(572);
    expect(l.gapStageTitle).toBe(40);
    expect(l.gapTitleButton).toBe(64);
    expect(l.titleSize).toBe(112);
    expect(l.button).toEqual({ height: 64, paddingX: 34, fontSize: 20 });
    expect(l.planet.size).toBeCloseTo(61.44, 2);
    expect(l.planet.left).toBeCloseTo(51.2, 2);
    expect(l.planet.top).toBe(48);
  });
  it('adds the safe-area insets to top and bottom padding', () => {
    const l = coverLayout({ width: 402, height: 874 }, { top: 59, bottom: 34 });
    expect(l.padding.top).toBeCloseTo(79, 1);
    expect(l.padding.bottom).toBeCloseTo(58, 1);
  });
});
