import { useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StoryContext } from './StoryContext';

interface SlideSectionProps { id: string; children: ReactNode; className?: string; }

export function SlideSection({ id, children, className }: SlideSectionProps) {
  const { activeId, readingMode } = useContext(StoryContext);
  return (
    <section id={id} data-slide-id={id} tabIndex={-1}
      inert={!readingMode && activeId !== id}
      aria-hidden={!readingMode && activeId !== id}
      aria-label={`Folie: ${id.replace(/^(speaker|intro|info|quiz|reveal|chart|fun)-/, '').replaceAll('-', ' ')}`}
      className={cn('story-section w-full flex flex-col items-center justify-center', className)}>
      {children}
    </section>
  );
}
