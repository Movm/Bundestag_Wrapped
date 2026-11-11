import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { Surface } from '@/design-system/surfaces';

export interface SurfaceFloodRef {
  /**
   * Covers a cut. The layer starts in the colour being left (so the jump behind it is
   * invisible), the new colour grows from `origin`, then the layer fades away.
   * Never blocks input; a new call replaces a running one.
   */
  play: (from: Surface, to: Surface, origin: { x: number; y: number }) => void;
}

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const GROW_MS = 360;
const FADE_MS = 160;

export const SurfaceFlood = forwardRef<SurfaceFloodRef>(function SurfaceFlood(_props, ref) {
  const layer = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLSpanElement>(null);
  const running = useRef<Animation[]>([]);

  useImperativeHandle(ref, () => ({
    play(from, to, origin) {
      const layerEl = layer.current;
      const discEl = disc.current;
      if (!layerEl || !discEl) return;
      running.current.forEach(animation => animation.cancel());
      layerEl.dataset.surface = from;
      discEl.dataset.surface = to;
      layerEl.hidden = false;
      const box = layerEl.getBoundingClientRect();
      discEl.style.left = `${origin.x - box.left}px`;
      discEl.style.top = `${origin.y - box.top}px`;
      const grow = discEl.animate([{ transform: 'scale(0.02)' }, { transform: 'scale(1)' }], { duration: GROW_MS, easing: EASE, fill: 'both' });
      const fade = layerEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, delay: GROW_MS, easing: EASE, fill: 'both' });
      running.current = [grow, fade];
      fade.onfinish = () => { layerEl.hidden = true; running.current = []; };
    },
  }), []);

  return <div ref={layer} hidden aria-hidden="true" className="story-flood"><span ref={disc} className="story-flood__disc" /></div>;
});
