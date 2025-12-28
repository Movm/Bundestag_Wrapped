import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { itemVariants } from './animations';
import { getSlideIconConfig } from '@/shared/slide-icons';

interface SlideHeaderProps {
  /** Large emoji displayed above the title */
  emoji: string;
  /** Main headline text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'default' | 'large';
  /** Slide ID for custom icon lookup (e.g., 'intro-topics' or 'info-topics') */
  slideId?: string;
}

/**
 * Standard slide header with emoji/icon, title, and optional subtitle.
 * Uses itemVariants for staggered animation when inside a container.
 * Supports custom SVG icons when slideId is provided.
 *
 * Memoized to prevent re-renders when parent re-renders with same props.
 */
export const SlideHeader = memo(function SlideHeader({
  emoji,
  title,
  subtitle,
  className,
  size = 'default',
  slideId,
}: SlideHeaderProps) {
  const emojiSize = size === 'large' ? 'text-6xl md:text-7xl' : 'text-4xl md:text-5xl';
  const titleSize = size === 'large' ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl';
  const iconSize = size === 'large' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-16 md:h-16';

  // Get icon config from centralized source
  const iconConfig = slideId ? getSlideIconConfig(slideId) : undefined;
  const IconComponent = iconConfig?.Icon;
  const animationClass = iconConfig?.animation;

  return (
    <motion.div
      variants={itemVariants}
      className={cn('text-center mb-8', className)}
    >
      {IconComponent ? (
        <div className="mb-3 flex justify-center">
          <IconComponent className={cn(iconSize, animationClass)} />
        </div>
      ) : (
        <span className={cn(emojiSize, 'mb-3 block')}>{emoji}</span>
      )}
      <h2 className={cn(titleSize, 'font-black text-white')}>{title}</h2>
      {subtitle && (
        <p className="text-white/60 mt-2 text-base md:text-lg">{subtitle}</p>
      )}
    </motion.div>
  );
});
