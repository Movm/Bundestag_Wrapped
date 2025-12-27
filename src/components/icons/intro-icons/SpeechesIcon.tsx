import type { IntroIconProps } from './types';

/**
 * Speeches Icon - Rising Bars / Voice Meter
 * Audio equalizer style vertical bars
 * Matches the "bars" background effect
 */
export function SpeechesIcon({
  className = 'w-24 h-24',
  primaryColor = '#F97316',
  secondaryColor = '#EAB308',
}: IntroIconProps) {
  const gradientId = 'speeches-gradient';

  // Bar configurations: [x position, height, delay multiplier]
  const bars = [
    { x: 12, height: 32, delay: 0 },
    { x: 24, height: 48, delay: 0.1 },
    { x: 36, height: 64, delay: 0.2 },
    { x: 48, height: 56, delay: 0.15 },
    { x: 60, height: 72, delay: 0.25 },
    { x: 72, height: 40, delay: 0.05 },
    { x: 84, height: 24, delay: 0 },
  ];

  return (
    <svg
      className={`${className} icon-animated`}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
      </defs>

      {/* Bars with rounded tops */}
      {bars.map(({ x, height }, i) => (
        <rect
          key={i}
          x={x - 4}
          y={88 - height}
          width="8"
          height={height}
          rx="4"
          fill={`url(#${gradientId})`}
          fillOpacity={0.7 + (height / 72) * 0.3}
        />
      ))}

      {/* Accent highlights on tallest bars */}
      <circle cx="60" cy="20" r="3" fill="white" fillOpacity="0.9" />
      <circle cx="36" cy="28" r="2.5" fill="white" fillOpacity="0.8" />
      <circle cx="48" cy="36" r="2" fill="white" fillOpacity="0.7" />

      {/* Base line */}
      <line
        x1="4"
        y1="88"
        x2="92"
        y2="88"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeOpacity="0.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
