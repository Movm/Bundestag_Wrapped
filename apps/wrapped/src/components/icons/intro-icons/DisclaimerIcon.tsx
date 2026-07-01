import type { IntroIconProps } from './types';

/**
 * Disclaimer Icon - Laboratory Flask
 * Represents experimental/prototype nature of the data
 * Amber/orange gradient conveys caution without alarm
 */
export function DisclaimerIcon({
  className = 'w-24 h-24',
  primaryColor = '#F59E0B',
  secondaryColor = '#D97706',
}: IntroIconProps) {
  const gradientId = 'disclaimer-gradient';

  return (
    <svg
      className={className}
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

      {/* Flask neck */}
      <rect
        x="40"
        y="12"
        width="16"
        height="20"
        rx="2"
        fill={`url(#${gradientId})`}
        fillOpacity="0.6"
      />

      {/* Flask neck rim */}
      <rect
        x="36"
        y="8"
        width="24"
        height="6"
        rx="2"
        fill={`url(#${gradientId})`}
        fillOpacity="0.9"
      />

      {/* Flask body */}
      <path
        d="M40 32 L28 60 Q24 68 28 76 Q32 84 48 84 Q64 84 68 76 Q72 68 68 60 L56 32 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.8"
      />

      {/* Liquid inside flask */}
      <path
        d="M32 64 Q28 72 32 78 Q36 82 48 82 Q60 82 64 78 Q68 72 64 64 Z"
        fill={primaryColor}
        fillOpacity="0.5"
      />

      {/* Bubbles in liquid */}
      <circle cx="40" cy="70" r="3" fill="white" fillOpacity="0.6" />
      <circle cx="52" cy="74" r="2" fill="white" fillOpacity="0.5" />
      <circle cx="46" cy="66" r="2" fill="white" fillOpacity="0.4" />

      {/* Outer stroke */}
      <path
        d="M40 32 L28 60 Q24 68 28 76 Q32 84 48 84 Q64 84 68 76 Q72 68 68 60 L56 32"
        stroke={primaryColor}
        strokeWidth="2"
        strokeOpacity="0.4"
        fill="none"
      />
    </svg>
  );
}
