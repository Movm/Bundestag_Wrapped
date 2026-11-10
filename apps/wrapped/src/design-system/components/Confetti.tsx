import { memo, useMemo, type CSSProperties } from 'react';

interface ConfettiProps {
  count?: number;
  colors: string[];
  /** Seconds each piece flies. */
  duration?: number;
}

/**
 * Celebration burst in pure CSS: each piece runs one compositor-only
 * keyframe animation (transform + opacity), so a correct answer costs no
 * JavaScript per frame. Render it inside an aria-hidden, pointer-events-none
 * layer and only when motion is allowed.
 */
export const Confetti = memo(function Confetti({ count = 20, colors, duration = 0.8 }: ConfettiProps) {
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      '--x': `${Math.random() * 200 - 100}px`,
      '--y': `${Math.random() * -50 - 10}vh`,
      '--r': `${Math.random() * 720 - 360}deg`,
      '--d': `${duration}s`,
      '--delay': `${Math.random() * Math.min(0.3, duration * 0.2)}s`,
      background: colors[i % colors.length],
    }) as CSSProperties),
    [count, colors, duration],
  );
  return <>{pieces.map((style, i) => <span key={i} className="ds-confetti absolute w-3 h-3 rounded-sm" style={style} />)}</>;
});
