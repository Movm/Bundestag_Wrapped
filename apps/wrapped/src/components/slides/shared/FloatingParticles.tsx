import { memo, useMemo, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';

interface FloatingParticlesProps {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
}

/**
 * High-performance floating particle system using CSS animations.
 *
 * Performance optimizations:
 * - Pre-computed particle data via useMemo (no recalculation on re-render)
 * - CSS @keyframes instead of JS animations (runs on compositor thread)
 * - Percentage-based positioning (SSR-safe, no window object)
 * - Shared keyframes and a bounded default particle count
 * - prefers-reduced-motion support for accessibility
 */
export const FloatingParticles = memo(function FloatingParticles({
  count = 24,
  color = 'rgb(236 72 153 / 0.2)', // pink-500/20
  minSize = 2,
  maxSize = 6,
}: FloatingParticlesProps) {
  // Pre-compute all particle data ONCE
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * (maxSize - minSize) + minSize,
        duration: Math.random() * 3 + 2, // 2-5s
        delay: Math.random() * 3,
        yOffset: Math.random() * 150 + 50, // 50-200px drift
        scale: Math.random() * 0.5 + 0.5, // 0.5-1.0
      })),
    [count, minSize, maxSize]
  );

  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Static parameters vary by particle; only transform and opacity animate. */}
      <style>{`@keyframes wrapped-particle-float { 0%, 100% { transform: translateY(0) scale(var(--particle-scale)); opacity: 0; } 50% { transform: translateY(var(--particle-drift)) scale(var(--particle-scale)); opacity: 1; } }`}</style>

      {/* Render particles with CSS animations */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            '--particle-scale': p.scale,
            '--particle-drift': `-${p.yOffset}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            animation: `wrapped-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
});
