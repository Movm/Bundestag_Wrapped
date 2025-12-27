import type { IntroIconProps } from './types';

/**
 * Topics Icon - Radial Data Burst
 * Concentric circles with data-point dots radiating outward
 * Matches the "pulse" background effect
 */
export function TopicsIcon({
  className = 'w-24 h-24',
  primaryColor = '#3B82F6',
  secondaryColor = '#06B6D4',
}: IntroIconProps) {
  const gradientId = 'topics-gradient';

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

      {/* Outer ring - stroke accent */}
      <circle
        cx="48"
        cy="48"
        r="42"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeOpacity="0.3"
        fill="none"
      />

      {/* Middle ring - stroke accent */}
      <circle
        cx="48"
        cy="48"
        r="30"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeOpacity="0.5"
        fill="none"
      />

      {/* Inner filled circle */}
      <circle
        cx="48"
        cy="48"
        r="18"
        fill={`url(#${gradientId})`}
        fillOpacity="0.9"
      />

      {/* Center dot */}
      <circle cx="48" cy="48" r="6" fill="white" fillOpacity="0.95" />

      {/* Data point dots on outer ring */}
      <circle cx="48" cy="6" r="4" fill={`url(#${gradientId})`} />
      <circle cx="84" cy="30" r="4" fill={`url(#${gradientId})`} />
      <circle cx="84" cy="66" r="4" fill={`url(#${gradientId})`} />
      <circle cx="48" cy="90" r="4" fill={`url(#${gradientId})`} />
      <circle cx="12" cy="66" r="4" fill={`url(#${gradientId})`} />
      <circle cx="12" cy="30" r="4" fill={`url(#${gradientId})`} />

      {/* Data point dots on middle ring */}
      <circle cx="48" cy="18" r="3" fill={`url(#${gradientId})`} fillOpacity="0.8" />
      <circle cx="74" cy="48" r="3" fill={`url(#${gradientId})`} fillOpacity="0.8" />
      <circle cx="48" cy="78" r="3" fill={`url(#${gradientId})`} fillOpacity="0.8" />
      <circle cx="22" cy="48" r="3" fill={`url(#${gradientId})`} fillOpacity="0.8" />

      {/* Connecting lines - subtle accents */}
      <line
        x1="48"
        y1="30"
        x2="48"
        y2="6"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="63"
        y1="39"
        x2="84"
        y2="30"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="63"
        y1="57"
        x2="84"
        y2="66"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="48"
        y1="66"
        x2="48"
        y2="90"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="33"
        y1="57"
        x2="12"
        y2="66"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="33"
        y1="39"
        x2="12"
        y2="30"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
    </svg>
  );
}
