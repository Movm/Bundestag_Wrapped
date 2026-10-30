import { usePageVisible } from '@/hooks/usePageVisible';
import { Activity, useContext, useState, useRef, useLayoutEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StoryContext } from './StoryContext';
import { SlideEffectsContext } from './SlideEffectsContext';

interface SlideSectionProps { id: string; children: ReactNode; className?: string; active?: boolean; }

export function SlideSection({ id, children, className, active = true }: SlideSectionProps) {
  const { activeId, readingMode } = useContext(StoryContext);
  const pageVisible = usePageVisible();
  // ScrollContainer selects synchronously; the parent's overscan state follows
  // in an effect. A fast jump must reveal its destination in this same commit.
  const visible = active || activeId === id || readingMode;
  const sectionRef = useRef<HTMLElement>(null);
  const retainedHeight = useRef(0);
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!visible || !pageVisible) {
      section.style.minHeight = retainedHeight.current ? `${retainedHeight.current}px` : '';
      return;
    }
    section.style.minHeight = '';
    const measure = () => {
      retainedHeight.current = section.getBoundingClientRect().height;
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    return () => observer.disconnect();
  }, [visible, pageVisible]);
  const effectsActive = pageVisible && (activeId ? activeId === id : active);
  const [visited, setVisited] = useState(visible);
  if (visible && !visited) setVisited(true);
  return (
    <section ref={sectionRef} id={id} data-slide-id={id} tabIndex={-1}
      data-slide-active={visible} data-slide-mounted={visited} data-slide-effects-active={effectsActive}
      inert={!readingMode && activeId !== '' && activeId !== id}
      aria-hidden={!readingMode && activeId !== '' && activeId !== id}
      aria-label={`Folie: ${id.replace(/^(speaker|intro|info|quiz|reveal|chart|fun)-/, '').replaceAll('-', ' ')}`}
      className={cn('story-section w-full flex flex-col items-center justify-center', className)}>
      {visited && <SlideEffectsContext value={effectsActive}><Activity mode={visible && pageVisible ? 'visible' : 'hidden'}>{children}</Activity></SlideEffectsContext>}
    </section>
  );
}
