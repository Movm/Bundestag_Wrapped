/**
 * The one place that knows when the browser lets this page make sound.
 *
 * Browsers only allow audio to start inside a user activation (a pointer or
 * key press). Safari goes further and grants that per media element: an
 * element that was never played inside an activation stays blocked. Effects
 * (`sounds.ts`) and music (`theme-music.ts`) both hook in here instead of
 * keeping their own listeners, so every part of the app unlocks on the same
 * press.
 */

type Listener = () => void;

/** Events that count as a user activation, so `play()`/`resume()` are allowed inside them. */
const ACTIVATION_EVENTS = ['pointerdown', 'pointerup', 'keydown'] as const;

const listeners = new Set<Listener>();
let armed = false;

function notify() {
  for (const listener of [...listeners]) listener();
}

/**
 * Calls `listener` synchronously inside every user activation until the
 * returned function unsubscribes it. Listeners run in the capture phase, so
 * they see the press before any click handler does.
 */
export function onUserActivation(listener: Listener): () => void {
  if (typeof document === 'undefined') return () => {};
  if (!armed) {
    armed = true;
    ACTIVATION_EVENTS.forEach(event => document.addEventListener(event, notify, true));
  }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * True once the reader has pressed anything on this page. Before that, every
 * browser refuses to start audio, so callers skip sounds instead of queueing
 * them for a surprise on the first click. Browsers without the
 * UserActivation API are treated as active and decide for themselves.
 */
export function hasUserActivation(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true;
}
