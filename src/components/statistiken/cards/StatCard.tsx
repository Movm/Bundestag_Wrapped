import { Link } from 'react-router';
import { motion } from 'motion/react';
import { formatNumber } from '@/lib/utils';
import type { SectionConfig } from '../shared/section-config';

type ValueFormat = 'number' | 'compact' | 'percentage' | 'text';

interface StatCardProps {
  /** Route path to navigate to */
  to: string;
  /** Section configuration (colors, labels, etc.) */
  config: SectionConfig;
  /** Main stat value to display */
  heroValue: number | string;
  /** Label describing the stat */
  heroLabel: string;
  /** Optional sublabel (e.g., party name, speaker name) */
  heroSublabel?: string;
  /** How to format the value */
  format?: ValueFormat;
}

function formatValue(value: number | string, format: ValueFormat): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'compact':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
      return formatNumber(value);
    case 'percentage':
      return `${value}%`;
    case 'text':
      return String(value);
    default:
      return formatNumber(value);
  }
}

/**
 * Clickable card for the overview dashboard.
 * Displays a section's hero stat with hover effects and links to the subpage.
 */
export function StatCard({
  to,
  config,
  heroValue,
  heroLabel,
  heroSublabel,
  format = 'number',
}: StatCardProps) {
  return (
    <Link to={to} className="block">
      <motion.article
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="relative bg-white/5 rounded-2xl p-6 border border-white/10
                   hover:border-white/20 transition-colors cursor-pointer group overflow-hidden"
      >
        {/* Accent gradient background */}
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${config.accent}20 0%, transparent 60%)`,
          }}
        />

        {/* Content */}
        <div className="relative">
          {/* Section number + emoji */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="font-mono text-xs font-bold"
              style={{ color: config.accent }}
            >
              {config.number}
            </span>
            <span className="text-2xl">{config.emoji}</span>
          </div>

          {/* Hero stat */}
          <div className="mb-4">
            <span
              className="text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: config.accent }}
            >
              {formatValue(heroValue, format)}
            </span>
            <p className="text-white/70 text-sm mt-1">{heroLabel}</p>
            {heroSublabel && (
              <p className="text-white/50 text-xs mt-0.5">{heroSublabel}</p>
            )}
          </div>

          {/* Title + arrow */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">{config.title}</h3>
            <span className="text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-200">
              →
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
