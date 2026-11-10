import { afterEach, expect, it, vi } from 'vitest';
import { whenTrulyIdle } from './when-idle';

afterEach(() => { vi.unstubAllGlobals(); });

it('waits for an idle period with enough budget', () => {
  const queue: IdleRequestCallback[] = [];
  vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => { queue.push(cb); return queue.length; });
  vi.stubGlobal('cancelIdleCallback', () => {});
  const task = vi.fn();
  whenTrulyIdle(task);
  queue.shift()!({ timeRemaining: () => 4, didTimeout: false });
  expect(task).not.toHaveBeenCalled();
  queue.shift()!({ timeRemaining: () => 45, didTimeout: false });
  expect(task).toHaveBeenCalledOnce();
});

it('runs anyway when the idle callback times out', () => {
  const queue: IdleRequestCallback[] = [];
  vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => { queue.push(cb); return 1; });
  vi.stubGlobal('cancelIdleCallback', () => {});
  const task = vi.fn();
  whenTrulyIdle(task);
  queue.shift()!({ timeRemaining: () => 0, didTimeout: true });
  expect(task).toHaveBeenCalledOnce();
});
