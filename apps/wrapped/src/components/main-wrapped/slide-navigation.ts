import { slideRole, surfaceForSlide } from '@/design-system/surfaces';

/**
 * A cut that deserves a colour flood: the story starts, or a new chapter, the share
 * slide or the finale begins on a different colour field. Moves inside a chapter never do.
 */
export function isChapterCut(fromId: string, toId: string): boolean {
  if (surfaceForSlide(fromId) === surfaceForSlide(toId)) return false;
  const from = slideRole(fromId);
  const to = slideRole(toId);
  return from === 'cover' || to === 'section' || to === 'share' || to === 'finale';
}

/** Consume one wheel gesture, including its momentum tail. Reversal interrupts. */
export class WheelGesture {
  private time = -Infinity;
  private direction = 0;
  private total = 0;
  private consumed = false;

  push(delta: number, time: number): number {
    if (!delta) return 0;
    const direction = Math.sign(delta);
    if (time - this.time > 180 || direction !== this.direction) {
      this.total = 0;
      this.consumed = false;
    }
    this.time = time;
    this.direction = direction;
    this.total += delta;
    if (this.consumed || Math.abs(this.total) < 50) return 0;
    this.consumed = true;
    return direction;
  }
}

/** Forward navigation cannot cross an unanswered quiz; backward navigation can. */
export function boundedTarget(from: number, requested: number, blocked: boolean[]): number {
  const target = Math.max(0, Math.min(requested, blocked.length - 1));
  for (let i = from; i < target; i++) if (blocked[i]) return i;
  return target;
}
