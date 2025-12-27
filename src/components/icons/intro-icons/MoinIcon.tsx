import type { IntroIconProps } from './types';

/**
 * Moin Icon - Curved Wave Arc
 * Friendly flowing arcs representing a wave gesture
 * Matches the "waves" background effect
 */
export function MoinIcon({
  className = 'w-24 h-24',
  primaryColor = '#22C55E',
  secondaryColor = '#16A34A',
}: IntroIconProps) {
  const gradientId = 'moin-gradient';

  return (
    <svg
      className={`${className} icon-animated`}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>

      {/* Main wave arc - largest, filled */}
      <path
        d="M12 60 Q48 20 84 60"
        stroke={`url(#${gradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Second arc - medium */}
      <path
        d="M20 72 Q48 40 76 72"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeOpacity="0.7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Third arc - smallest */}
      <path
        d="M28 82 Q48 58 68 82"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeOpacity="0.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Accent dot at peak */}
      <circle cx="48" cy="32" r="6" fill={`url(#${gradientId})`} />
      <circle cx="48" cy="32" r="3" fill="white" fillOpacity="0.9" />

      {/* Motion lines - accent strokes */}
      <path
        d="M32 24 Q28 20 24 24"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeOpacity="0.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M72 24 Q68 20 64 24"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeOpacity="0.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 40 Q20 36 16 40"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeOpacity="0.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M80 40 Q76 36 72 40"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeOpacity="0.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
