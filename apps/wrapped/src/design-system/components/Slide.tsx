import { motion } from 'motion/react';
import { useContext, type ReactNode } from 'react';
import { StoryContext } from '@/components/main-wrapped/StoryContext';
import { cn } from '@/lib/utils';
import { ENTER, IN_VIEW, STAGGER, type EnterKind } from '../motion';
import { Shapes, type ShapePreset } from './Shapes';

interface SlideProps {
  children: ReactNode;
  /** Decorative shapes behind the content; `false` for none. */
  shapes?: ShapePreset | false;
  /** Bottom row: note on the left, action on the right. */
  footer?: ReactNode;
  className?: string;
  /** Content column alignment. */
  align?: 'start' | 'center';
}

/**
 * Layout of every slide: full-height column, side gutters, max 1280px content,
 * vertically centred, optional footer row. The coloured field itself comes from
 * the surrounding `data-surface` (set by SlideSection from the slide role), so
 * a Slide never chooses its own background.
 */
export function Slide({ children, shapes, footer, className, align = 'start' }: SlideProps) {
  const { arrival } = useContext(StoryContext);
  return (
    <div className={cn('ds-slide', className)}>
      {shapes !== false && shapes && <Shapes preset={shapes} />}
      <motion.div
        className={cn('ds-slide__body', align === 'center' && 'items-center text-center')}
        variants={STAGGER}
        custom={arrival}
        initial="hidden"
        whileInView="visible"
        viewport={IN_VIEW}
      >
        {children}
      </motion.div>
      {footer && (
        <motion.div className="ds-slide__footer" variants={ENTER.rise} initial="hidden" whileInView="visible" viewport={IN_VIEW}>
          {footer}
        </motion.div>
      )}
    </div>
  );
}

interface EnterProps {
  children: ReactNode;
  kind?: EnterKind;
  className?: string;
  as?: 'div' | 'li' | 'p' | 'span';
  style?: React.CSSProperties;
}

/** A staggered child of a Slide (or any STAGGER parent). */
export function Enter({ children, kind = 'rise', className, as = 'div', style }: EnterProps) {
  const Tag = motion[as];
  return (
    <Tag className={className} style={style} variants={ENTER[kind]}>
      {children}
    </Tag>
  );
}
