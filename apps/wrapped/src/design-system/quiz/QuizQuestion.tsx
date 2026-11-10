import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ENTER } from '../motion';

/** Question headline; plain text so any edition-defined question works. */
export function QuizQuestion({ id, text, tone = 'on', className }: { id: string; text: string; tone?: 'on' | 'display-accent'; className?: string }) {
  return (
    <motion.h2 id={id} variants={ENTER.rise} className={cn('ds-display ds-display--lg ds-quiz__question', tone === 'display-accent' && 'text-display-accent', className)}>
      {text}
    </motion.h2>
  );
}
