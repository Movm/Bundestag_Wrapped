import type { IntroIconProps } from './types';

/**
 * Vocabulary Icon - Stacked Wave Lines
 * Horizontal wavy lines representing sound/speech waves
 * Matches the "waves" background effect
 */
export function VocabularyIcon({
  className = 'w-24 h-24',
  primaryColor = '#8B5CF6',
  secondaryColor = '#6366F1',
}: IntroIconProps) {
  const gradientId = 'vocabulary-gradient';

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

      {/* Wave line 1 - top, thinnest */}
      <path
        d="M8 24 Q24 16 40 24 T72 24 T88 24"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeOpacity="0.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Wave line 2 */}
      <path
        d="M8 38 Q24 28 40 38 T72 38 T88 38"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeOpacity="0.7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Wave line 3 - center, thickest (filled) */}
      <path
        d="M4 48 Q20 36 40 48 T76 48 T92 48"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Wave line 4 */}
      <path
        d="M8 58 Q24 68 40 58 T72 58 T88 58"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeOpacity="0.7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Wave line 5 - bottom, thinnest */}
      <path
        d="M8 72 Q24 80 40 72 T72 72 T88 72"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeOpacity="0.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Accent dots at wave peaks */}
      <circle cx="40" cy="48" r="4" fill="white" fillOpacity="0.9" />
      <circle cx="76" cy="48" r="3" fill="white" fillOpacity="0.7" />
    </svg>
  );
}
