import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Eyebrow } from '@/design-system/components/Type';

interface SectionHeaderProps {
  sectionNumber?: string;
  emoji: string;
  title: string;
  subtitle: string;
  explanation?: string;
  accentColor?: string;
  size?: 'default' | 'large';
  className?: string;
  /** Hide the section number */
  hideNumber?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const numberVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, bounce: 0.3, duration: 0.6 },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, bounce: 0.3, duration: 0.6 },
  },
};

export function SectionHeader({
  sectionNumber,
  title,
  subtitle,
  explanation,
  size = 'default',
  className,
  hideNumber = false,
}: SectionHeaderProps) {
  const isLarge = size === 'large';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={cn('mb-12 max-w-4xl', className)}
    >
      {!hideNumber && sectionNumber && (
        <motion.div variants={numberVariants} className="mb-4">
          <Eyebrow>{sectionNumber}</Eyebrow>
        </motion.div>
      )}

      <motion.h2
        variants={textVariants}
        className={cn('ds-display', isLarge ? 'ds-display--lg' : 'ds-display--md', 'mb-4')}
      >
        {title}
      </motion.h2>

      <motion.p variants={textVariants} className="text-on-muted text-lg md:text-xl max-w-[65ch] font-medium leading-snug">
        {subtitle}
      </motion.p>

      {explanation && (
        <motion.p variants={textVariants} className="text-on-muted text-base md:text-lg max-w-[65ch] mt-5 leading-relaxed">
          {explanation}
        </motion.p>
      )}
    </motion.div>
  );
}
