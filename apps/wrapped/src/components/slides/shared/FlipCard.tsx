import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { playSound } from '@/lib/sounds';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  label: string;
  className?: string;
  size?: string;
  hoverScale?: boolean;
}

/** A single activation path avoids flipping twice on touch (touchstart + click). */
export function FlipCard({ front, back, label, className = '', size, hoverScale = true }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const reducedMotion = useReducedMotion();
  return (
    <div className={`flip-card relative ${className}`} style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: !reducedMotion && isFlipped ? 180 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0" hidden={Boolean(reducedMotion && isFlipped)} aria-hidden={isFlipped}
          style={{ backfaceVisibility: 'hidden' }}>{front}</div>
        <div className="absolute inset-0" hidden={Boolean(reducedMotion && !isFlipped)} aria-hidden={!isFlipped}
          style={{ backfaceVisibility: 'hidden', transform: reducedMotion ? undefined : 'rotateY(180deg)' }}>{back}</div>
      </motion.div>
      <motion.button type="button" className="absolute inset-0 w-full h-full rounded-full cursor-pointer"
        aria-label={`${label}: Details ${isFlipped ? 'verbergen' : 'anzeigen'}`} aria-expanded={isFlipped}
        whileTap={hoverScale && !reducedMotion ? { scale: 0.98 } : undefined}
        onClick={() => { setIsFlipped(value => !value); playSound('click'); }} />
    </div>
  );
}
