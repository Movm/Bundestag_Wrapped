/**
 * Run `task` in a truly idle moment: an idle period with at least `budget` ms
 * left, i.e. no frame is due soon and nothing is animating. Native work that
 * blocks the main thread (creating media elements, decoding) belongs here; a
 * plain requestIdleCallback also fires in the short gaps between animation
 * frames and would still cost a frame. Falls back to running after `timeout`.
 */
export function whenTrulyIdle(task: () => void, { budget = 30, timeout = 6000 } = {}): () => void {
  if (typeof window === 'undefined') return () => {};
  if (typeof window.requestIdleCallback !== 'function') {
    const timer = window.setTimeout(task, 1500);
    return () => window.clearTimeout(timer);
  }
  const deadline = Date.now() + timeout;
  let handle = 0;
  const attempt = (idle: IdleDeadline) => {
    if (idle.timeRemaining() >= budget || idle.didTimeout || Date.now() >= deadline) { task(); return; }
    handle = window.requestIdleCallback(attempt, { timeout: Math.max(1, deadline - Date.now()) });
  };
  handle = window.requestIdleCallback(attempt, { timeout });
  return () => window.cancelIdleCallback(handle);
}
