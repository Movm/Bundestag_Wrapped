import type { IntroIconProps } from './types';

/**
 * Moin Icon - Minimalistic Horizontal Waves
 * Clean, flowing sine waves representing water/ocean
 * Light blue color scheme for a fresh, water-ish feel
 */
export function MoinIcon({
  className = 'w-24 h-24',
  primaryColor = '#38BDF8',
  secondaryColor = '#0EA5E9',
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

      {/* Top wave - full opacity */}
      <path
        d="M8 36 C24 24, 40 48, 56 36 S88 24, 88 36"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Middle wave - medium opacity */}
      <path
        d="M8 52 C24 40, 40 64, 56 52 S88 40, 88 52"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeOpacity="0.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom wave - lighter opacity */}
      <path
        d="M8 68 C24 56, 40 80, 56 68 S88 56, 88 68"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeOpacity="0.35"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
