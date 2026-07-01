import type { IntroIconProps } from './types';

/**
 * Drama Icon - Lightning Clash
 * Two angular lightning bolts crossing
 * Matches the "lightning" background effect
 */
export function DramaIcon({
  className = 'w-24 h-24',
  primaryColor = '#EF4444',
  secondaryColor = '#DC2626',
}: IntroIconProps) {
  const gradientId = 'drama-gradient';

  return (
    <svg
      className={`${className} icon-animated`}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <filter id="drama-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Left lightning bolt */}
      <path
        d="M24 8 L32 36 L20 40 L40 88 L34 52 L46 48 L24 8"
        fill={`url(#${gradientId})`}
        filter="url(#drama-glow)"
      />

      {/* Right lightning bolt */}
      <path
        d="M72 8 L64 36 L76 40 L56 88 L62 52 L50 48 L72 8"
        fill={`url(#${gradientId})`}
        fillOpacity="0.85"
        filter="url(#drama-glow)"
      />

      {/* Central clash spark */}
      <circle cx="48" cy="44" r="6" fill="white" fillOpacity="0.95" />

      {/* Spark accents */}
      <circle cx="48" cy="36" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="42" cy="44" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="54" cy="44" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="48" cy="52" r="2" fill="white" fillOpacity="0.7" />

      {/* Outline accents for depth */}
      <path
        d="M24 8 L32 36 L20 40 L40 88"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.3"
        fill="none"
      />
      <path
        d="M72 8 L64 36 L76 40 L56 88"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.3"
        fill="none"
      />
    </svg>
  );
}
