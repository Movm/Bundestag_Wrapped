import type { IntroIconProps } from './types';

/**
 * Common Words Icon - Floating Bubbles Cluster
 * Overlapping circles like a word cloud or bubble chart
 * Matches the "orbs" background effect
 */
export function CommonWordsIcon({
  className = 'w-24 h-24',
  primaryColor = '#14B8A6',
  secondaryColor = '#0D9488',
}: IntroIconProps) {
  const gradientId = 'common-words-gradient';

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
        <radialGradient id={`${gradientId}-radial`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Main large bubble - center */}
      <circle
        cx="48"
        cy="48"
        r="24"
        fill={`url(#${gradientId})`}
      />
      <circle
        cx="48"
        cy="48"
        r="24"
        fill={`url(#${gradientId}-radial)`}
      />

      {/* Medium bubble - top right */}
      <circle
        cx="72"
        cy="32"
        r="16"
        fill={`url(#${gradientId})`}
        fillOpacity="0.85"
      />

      {/* Medium bubble - bottom left */}
      <circle
        cx="28"
        cy="68"
        r="14"
        fill={`url(#${gradientId})`}
        fillOpacity="0.8"
      />

      {/* Small bubble - top left */}
      <circle
        cx="24"
        cy="28"
        r="10"
        fill={`url(#${gradientId})`}
        fillOpacity="0.7"
      />

      {/* Small bubble - bottom right */}
      <circle
        cx="76"
        cy="64"
        r="12"
        fill={`url(#${gradientId})`}
        fillOpacity="0.75"
      />

      {/* Tiny accent bubbles */}
      <circle cx="56" cy="20" r="6" fill={`url(#${gradientId})`} fillOpacity="0.6" />
      <circle cx="16" cy="48" r="5" fill={`url(#${gradientId})`} fillOpacity="0.5" />
      <circle cx="84" cy="48" r="4" fill={`url(#${gradientId})`} fillOpacity="0.5" />

      {/* Highlight dots */}
      <circle cx="40" cy="40" r="4" fill="white" fillOpacity="0.8" />
      <circle cx="66" cy="26" r="3" fill="white" fillOpacity="0.7" />
      <circle cx="22" cy="62" r="2.5" fill="white" fillOpacity="0.6" />

      {/* Stroke accents on main bubble */}
      <circle
        cx="48"
        cy="48"
        r="24"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="none"
      />
    </svg>
  );
}
