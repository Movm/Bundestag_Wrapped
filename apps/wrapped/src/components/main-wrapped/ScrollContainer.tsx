import { Children, isValidElement, useRef, useState, useImperativeHandle, forwardRef, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StoryContext } from './StoryContext';

interface ScrollContainerProps {
  children: ReactNode;
  initialSection?: string | null;
  onSectionChange?: (sectionId: string) => void;
  className?: string;
}

export interface ScrollContainerRef {
  scrollToNextSlide: (currentSlideId: string) => void;
  scrollToSlide: (slideId: string) => void;
  containerRef: HTMLDivElement | null;
}

/** Native scrolling keeps long slides readable; explicit controls provide the same journey by keyboard. */
export const ScrollContainer = forwardRef<ScrollContainerRef, ScrollContainerProps>(
  function ScrollContainer({ children, initialSection, onSectionChange, className }, ref) {
    const ids = Children.toArray(children).flatMap(child => isValidElement<{ id: string }>(child) ? [child.props.id] : []);
    const [activeId, setActiveId] = useState(initialSection ?? ids[0] ?? '');
    const [readingMode, setReadingMode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentId = ids.includes(activeId) ? activeId : ids[0] ?? '';
    const index = Math.max(0, ids.indexOf(currentId));

    useEffect(() => { onSectionChange?.(currentId); }, [currentId, onSectionChange]);

    const navigate = useCallback((id: string, focus = true) => {
      const container = containerRef.current;
      const section = Array.from(container?.querySelectorAll<HTMLElement>('[data-slide-id]') ?? [])
        .find(section => section.id === id);
      if (!container || !section) return;
      // Remove inert before moving focus; React reconciles it on the next render.
      section.inert = false;
      section.removeAttribute('aria-hidden');
      setActiveId(id);
      if (focus) section.focus({ preventScroll: true });
      container.scrollTo({ top: section.offsetTop, behavior: 'instant' });
    }, []);

    useLayoutEffect(() => {
      if (initialSection) navigate(initialSection, false);
    }, [initialSection, navigate]);

    useImperativeHandle(ref, () => ({
      scrollToNextSlide: id => {
        const next = ids[ids.indexOf(id) + 1];
        if (next) navigate(next);
      },
      scrollToSlide: id => navigate(id),
      get containerRef() { return containerRef.current; },
    }));

    const trackSection = () => {
      const container = containerRef.current;
      if (!container) return;
      const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-slide-id]'));
      // The viewport midpoint selects the visible slide even when its content is tall.
      const anchor = container.getBoundingClientRect().top + container.clientHeight / 2;
      const section = sections.find(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= anchor && rect.bottom > anchor;
      });
      if (!section || section.id === currentId) return;
      const previous = sections.find(section => section.id === currentId);
      if (!readingMode && previous?.contains(document.activeElement)) {
        section.inert = false;
        section.removeAttribute('aria-hidden');
        section.focus({ preventScroll: true });
      }
      setActiveId(section.id);
    };

    return (
      <div className="story-shell">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Safari needs an explicit tab stop to scroll text-only slides by keyboard. */}
        <div ref={containerRef} data-story-scroll tabIndex={0} role="region" aria-label="Wrapped-Folien" onScroll={trackSection}
          className={cn('story-scroll relative overflow-y-auto overscroll-contain', className)}>
          <StoryContext value={{ activeId: currentId, readingMode }}>{children}</StoryContext>
        </div>
        <nav aria-label="Foliennavigation" className="story-navigation">
          <button type="button" disabled={index === 0} onClick={() => navigate(ids[index - 1])}>Zurück</button>
          <span className="text-xs text-white/80" role="status" aria-live="polite">Folie {index + 1} von {ids.length}</span>
          <button type="button" disabled={index === ids.length - 1} onClick={() => navigate(ids[index + 1])}>Weiter</button>
          <label className="flex items-center justify-center gap-2 min-h-11 text-sm col-span-3">
            <input type="checkbox" checked={readingMode} onChange={event => setReadingMode(event.target.checked)} />
            Lesemodus (alle Folien)
          </label>
        </nav>
      </div>
    );
  }
);
