import type { IntroIconProps } from './types';

/**
 * Tone Icon - Flowing Ribbon
 * Elegant S-curve ribbon shape
 * Matches the "ribbons" background effect
 */
export function ToneIcon({
  className = 'w-24 h-24',
  primaryColor = '#A855F7',
  secondaryColor = '#7C3AED',
}: IntroIconProps) {
  const gradientId = 'tone-gradient';

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
        <linearGradient id={`${gradientId}-reverse`} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>

      {/* Main ribbon - S-curve, filled with gradient */}
      <path
        d="M16 20
           C 40 20, 56 40, 56 48
           C 56 56, 40 76, 80 76
           L 80 84
           C 32 84, 48 60, 48 48
           C 48 36, 32 28, 16 28
           Z"
        fill={`url(#${gradientId})`}
      />

      {/* Secondary ribbon - parallel, smaller */}
      <path
        d="M80 12
           C 56 12, 40 32, 40 40
           C 40 48, 56 68, 16 68
           L 16 60
           C 64 60, 48 44, 48 40
           C 48 36, 64 20, 80 20
           Z"
        fill={`url(#${gradientId}-reverse)`}
        fillOpacity="0.6"
      />

      {/* Accent stroke on main ribbon edge */}
      <path
        d="M16 20 C 40 20, 56 40, 56 48 C 56 56, 40 76, 80 76"
        stroke="white"
        strokeWidth="2"
        strokeOpacity="0.4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Highlight dots at curves */}
      <circle cx="36" cy="34" r="4" fill="white" fillOpacity="0.85" />
      <circle cx="60" cy="62" r="3" fill="white" fillOpacity="0.7" />
      <circle cx="60" cy="26" r="3" fill="white" fillOpacity="0.6" />
    </svg>
  );
}
