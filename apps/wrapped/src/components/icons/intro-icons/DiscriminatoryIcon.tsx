import type { IntroIconProps } from './types';

/**
 * Discriminatory Icon - Muted Triangle
 * Minimalist warning triangle, understated for serious topic
 * Matches the "gradient" (muted) background effect
 */
export function DiscriminatoryIcon({
  className = 'w-24 h-24',
  primaryColor = '#64748B',
  secondaryColor = '#475569',
}: IntroIconProps) {
  const gradientId = 'discriminatory-gradient';

  return (
    <svg
      className={`${className}`} // No animation for this serious topic
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>

      {/* Outer triangle - filled */}
      <path
        d="M48 12 L88 80 L8 80 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.8"
      />

      {/* Inner triangle cutout effect */}
      <path
        d="M48 28 L72 68 L24 68 Z"
        fill="black"
        fillOpacity="0.3"
      />

      {/* Exclamation mark - subtle */}
      <rect
        x="45"
        y="38"
        width="6"
        height="18"
        rx="3"
        fill="white"
        fillOpacity="0.9"
      />
      <circle
        cx="48"
        cy="64"
        r="4"
        fill="white"
        fillOpacity="0.9"
      />

      {/* Subtle outer stroke */}
      <path
        d="M48 12 L88 80 L8 80 Z"
        stroke={primaryColor}
        strokeWidth="2"
        strokeOpacity="0.4"
        fill="none"
      />
    </svg>
  );
}
