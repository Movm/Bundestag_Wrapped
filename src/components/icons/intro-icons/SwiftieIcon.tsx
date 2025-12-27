import type { IntroIconProps } from './types';

/**
 * Swiftie Icon - Sparkle Burst
 * Central star with radiating sparkles
 * Matches the "sparkles" background effect
 */
export function SwiftieIcon({
  className = 'w-24 h-24',
  primaryColor = '#EC4899',
  secondaryColor = '#F472B6',
}: IntroIconProps) {
  const gradientId = 'swiftie-gradient';

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
        <filter id="sparkle-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Central 4-point star - largest */}
      <path
        d="M48 16 L52 40 L76 48 L52 56 L48 80 L44 56 L20 48 L44 40 Z"
        fill={`url(#${gradientId})`}
        filter="url(#sparkle-glow)"
      />

      {/* Inner highlight */}
      <circle cx="48" cy="48" r="8" fill="white" fillOpacity="0.9" />

      {/* Surrounding 4-point stars - smaller */}
      <path
        d="M20 20 L22 28 L30 30 L22 32 L20 40 L18 32 L10 30 L18 28 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.8"
      />
      <path
        d="M76 20 L78 28 L86 30 L78 32 L76 40 L74 32 L66 30 L74 28 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.7"
      />
      <path
        d="M20 60 L22 68 L30 70 L22 72 L20 80 L18 72 L10 70 L18 68 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.7"
      />
      <path
        d="M76 60 L78 68 L86 70 L78 72 L76 80 L74 72 L66 70 L74 68 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.8"
      />

      {/* Tiny diamond sparkles */}
      <path
        d="M48 4 L50 8 L48 12 L46 8 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.6"
      />
      <path
        d="M48 84 L50 88 L48 92 L46 88 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.6"
      />
      <path
        d="M4 48 L8 50 L12 48 L8 46 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.6"
      />
      <path
        d="M84 48 L88 50 L92 48 L88 46 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.6"
      />

      {/* Accent dots */}
      <circle cx="36" cy="24" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="60" cy="24" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="36" cy="72" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="60" cy="72" r="2" fill="white" fillOpacity="0.7" />
    </svg>
  );
}
