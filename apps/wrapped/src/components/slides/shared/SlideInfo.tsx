import { memo } from 'react';
import { motion } from 'motion/react';
import { getSlideIconConfig } from '@/shared/slide-icons';

interface SlideInfoProps {
  emoji: string;
  title: string;
  body: string;
  /** Slide ID for custom icon lookup (e.g., 'info-topics') */
  slideId?: string;
}

/**
 * Educational info slide - appears between quiz and reveal.
 * Shows emoji/icon, title, and 1-2 sentences explaining the topic.
 * Supports custom SVG icons when slideId is provided.
 *
 * Memoized to prevent re-renders when parent re-renders with same props.
 */
export const SlideInfo = memo(function SlideInfo({ emoji, title, body, slideId }: SlideInfoProps) {
  // Get icon config from centralized source (handles info-* -> section mapping)
  const iconConfig = slideId ? getSlideIconConfig(slideId) : undefined;
  const IconComponent = iconConfig?.Icon;
  const animationClass = iconConfig?.animation;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* Icon or Emoji with scale-pop effect */}
        {IconComponent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.1,
              type: 'spring',
              bounce: 0.5,
              duration: 0.6,
            }}
            className="mb-4 flex justify-center"
          >
            <IconComponent className={`w-14 h-14 md:w-18 md:h-18 ${animationClass ?? ''}`} />
          </motion.div>
        ) : (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.1,
              type: 'spring',
              bounce: 0.5,
              duration: 0.6,
            }}
            className="text-5xl md:text-6xl mb-4 block"
          >
            {emoji}
          </motion.span>
        )}

        {/* Title with slide-up spring animation */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: 'spring', bounce: 0.3 }}
          className="text-xl md:text-2xl font-bold text-white mb-4"
        >
          {title}
        </motion.h2>

        {/* Body text with fade-in */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-white/70 text-base md:text-lg leading-relaxed"
        >
          {body}
        </motion.p>
      </div>
    </div>
  );
});
