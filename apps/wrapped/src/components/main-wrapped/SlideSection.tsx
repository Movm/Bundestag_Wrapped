import { usePageVisible } from '@/hooks/usePageVisible';
import { Activity, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StoryContext } from './StoryContext';
import { SlideEffectsContext } from './SlideEffectsContext';

interface SlideSectionProps { id: string; children: ReactNode; className?: string; active?: boolean; }

export function SlideSection({ id, children, className, active = true }: SlideSectionProps) {
  const { activeId, readingMode } = useContext(StoryContext);
  const pageVisible = usePageVisible();
  const visible = active || readingMode;
  const effectsActive = pageVisible && (activeId ? activeId === id : active);
  const [visited, setVisited] = useState(visible);
  if (visible && !visited) setVisited(true);
  return (
    <section id={id} data-slide-id={id} tabIndex={-1}
      data-slide-active={visible} data-slide-mounted={visited} data-slide-effects-active={effectsActive}
      inert={!readingMode && activeId !== '' && activeId !== id}
      aria-hidden={!readingMode && activeId !== '' && activeId !== id}
      aria-label={`Folie: ${id.replace(/^(speaker|intro|info|quiz|reveal|chart|fun)-/, '').replaceAll('-', ' ')}`}
      className={cn('story-section w-full flex flex-col items-center justify-center', className)}>
      {visited && <SlideEffectsContext value={effectsActive}><Activity mode={visible && pageVisible ? 'visible' : 'hidden'}>{children}</Activity></SlideEffectsContext>}
    </section>
  );
}
