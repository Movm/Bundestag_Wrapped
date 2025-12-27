import type { IntroIconProps } from './types';

/**
 * Gender Icon - Balanced Grid/Scales
 * Abstract balanced figures representing equality
 * Matches the "grid" background effect
 */
export function GenderIcon({
  className = 'w-24 h-24',
  primaryColor = '#0EA5E9',
  secondaryColor = '#06B6D4',
}: IntroIconProps) {
  const gradientId = 'gender-gradient';

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
      </defs>

      {/* Balance beam - horizontal line */}
      <rect
        x="8"
        y="46"
        width="80"
        height="4"
        rx="2"
        fill={`url(#${gradientId})`}
      />

      {/* Center fulcrum/pivot */}
      <path
        d="M48 50 L56 80 L40 80 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.8"
      />
      <circle cx="48" cy="48" r="6" fill={`url(#${gradientId})`} />
      <circle cx="48" cy="48" r="3" fill="white" fillOpacity="0.9" />

      {/* Left figure - abstract person */}
      <circle cx="24" cy="24" r="12" fill={`url(#${gradientId})`} />
      <circle cx="24" cy="24" r="5" fill="white" fillOpacity="0.8" />
      <rect
        x="22"
        y="36"
        width="4"
        height="10"
        rx="2"
        fill={`url(#${gradientId})`}
        fillOpacity="0.7"
      />

      {/* Right figure - abstract person */}
      <circle cx="72" cy="24" r="12" fill={`url(#${gradientId})`} />
      <circle cx="72" cy="24" r="5" fill="white" fillOpacity="0.8" />
      <rect
        x="70"
        y="36"
        width="4"
        height="10"
        rx="2"
        fill={`url(#${gradientId})`}
        fillOpacity="0.7"
      />

      {/* Grid lines - subtle background pattern */}
      <line
        x1="24"
        y1="12"
        x2="24"
        y2="46"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeDasharray="4 4"
      />
      <line
        x1="72"
        y1="12"
        x2="72"
        y2="46"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeDasharray="4 4"
      />

      {/* Base stability line */}
      <rect
        x="36"
        y="80"
        width="24"
        height="4"
        rx="2"
        fill={`url(#${gradientId})`}
        fillOpacity="0.6"
      />
    </svg>
  );
}
