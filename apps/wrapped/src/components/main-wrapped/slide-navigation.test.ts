import { describe, expect, it } from 'vitest';
import { boundedTarget, WheelGesture } from './slide-navigation';

describe('wheel intent', () => {
  it('accumulates small deltas but consumes the entire momentum tail once', () => {
    const gesture = new WheelGesture();
    expect(gesture.push(20, 0)).toBe(0);
    expect(gesture.push(35, 20)).toBe(1);
    for (let time = 40; time < 900; time += 20) expect(gesture.push(80, time)).toBe(0);
    expect(gesture.push(60, 1200)).toBe(1);
  });
  it('accepts reversal immediately without a timer lock', () => {
    const gesture = new WheelGesture();
    expect(gesture.push(80, 0)).toBe(1);
    expect(gesture.push(-80, 10)).toBe(-1);
    expect(gesture.push(0, 20)).toBe(0);
    expect(gesture.push(-80, 30)).toBe(0);
  });
});
describe('navigation gates', () => {
  it('stops at the first unanswered slide even for distant navigation', () => {
    expect(boundedTarget(0, 3, [false, true, false, false])).toBe(1);
    expect(boundedTarget(1, 2, [false, true, false])).toBe(1);
  });
  it('allows backward navigation and respects journey boundaries', () => {
    expect(boundedTarget(2, 0, [true, true, true])).toBe(0);
    expect(boundedTarget(0, -1, [false, false])).toBe(0);
    expect(boundedTarget(1, 10, [false, false])).toBe(1);
  });
});
