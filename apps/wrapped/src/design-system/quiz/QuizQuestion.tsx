import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ENTER } from '../motion';

/** Question headline; plain text so any edition-defined question works. */
export function QuizQuestion({ id, text, tone = 'on', className }: { id: string; text: string; tone?: 'on' | 'display-accent'; className?: string }) {
  return (
    <motion.h2 id={id} variants={ENTER.rise} className={cn('ds-display ds-quiz__question', text.length > 60 ? 'ds-display--md' : 'ds-display--lg', tone === 'display-accent' && 'text-display-accent', className)}>
      {text}
    </motion.h2>
  );
}
