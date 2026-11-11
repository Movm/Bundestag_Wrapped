import { describe, expect, it } from 'vitest';
import { boundedTarget, hashJumpTarget, isChapterCut, slideIndexFromHash, WheelGesture } from './slide-navigation';

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

describe('chapter cuts', () => {
  it('marks the start and chapter openings, not moves inside a chapter', () => {
    expect(isChapterCut('intro', 'info-disclaimer')).toBe(true);
    expect(isChapterCut('reveal-topics', 'intro-vocabulary')).toBe(true);
    expect(isChapterCut('reveal-gender', 'share')).toBe(true);
    expect(isChapterCut('intro-topics', 'quiz-topics')).toBe(false);
    expect(isChapterCut('quiz-topics', 'info-topics')).toBe(false);
    expect(isChapterCut('reveal-gender', 'finale')).toBe(false); // ink to ink
  });
});

describe('slide deep links', () => {
  const ids = ['intro', 'quiz-a', 'reveal-a', 'share'];

  it('finds the slide a hash names and ignores everything else', () => {
    expect(slideIndexFromHash('#reveal-a', ids)).toBe(2);
    expect(slideIndexFromHash('reveal-a', ids)).toBe(2);
    expect(slideIndexFromHash('#nope', ids)).toBe(-1);
    expect(slideIndexFromHash('', ids)).toBe(-1);
    expect(slideIndexFromHash('#', ids)).toBe(-1);
    expect(slideIndexFromHash('#%E0%A4%A', ids)).toBe(-1);
  });

  it('stops at an unanswered quiz outside development and skips the gates inside it', () => {
    const blocked = [false, true, false, false];
    expect(hashJumpTarget(0, 3, blocked, false)).toBe(1);
    expect(hashJumpTarget(0, 3, blocked, true)).toBe(3);
    expect(hashJumpTarget(2, 0, blocked, false)).toBe(0);
  });
});
