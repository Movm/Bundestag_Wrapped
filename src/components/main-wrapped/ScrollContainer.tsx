import { useRef, useImperativeHandle, forwardRef, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScrollContainerProps {
  children: ReactNode;
  onSectionChange?: (sectionId: string) => void;
  locked?: boolean;
  className?: string;
}

export interface ScrollContainerRef {
  scrollToNextSlide: (currentSlideId: string) => void;
  scrollToSlide: (slideId: string) => void;
  containerRef: HTMLDivElement | null;
}

// Wheel scroll constants (tunable)
const SCROLL_THRESHOLD = 50;   // Accumulated delta needed to trigger scroll
const SCROLL_COOLDOWN = 600;   // ms to wait after scrolling before allowing another
const DELTA_RESET_DELAY = 150; // ms of no wheel events before resetting accumulator

export const ScrollContainer = forwardRef<ScrollContainerRef, ScrollContainerProps>(
  function ScrollContainer({ children, onSectionChange, locked, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Store callback in ref to avoid recreating IntersectionObserver
    const onSectionChangeRef = useRef(onSectionChange);
    onSectionChangeRef.current = onSectionChange;

    // Wheel scroll state
    const currentSectionRef = useRef<string | null>(null);
    const isScrollingRef = useRef(false);
    const accumulatedDeltaRef = useRef(0);
    const deltaResetTimeoutRef = useRef<number>();

    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              const id = entry.target.getAttribute('data-slide-id');
              if (id) onSectionChangeRef.current?.(id);
            }
          }
        },
        { root: containerRef.current, threshold: 0.5 }
      );

      const sections = containerRef.current.querySelectorAll('[data-slide-id]');
      sections.forEach((section) => observer.observe(section));

      return () => observer.disconnect();
    }, []); // Empty deps - observer is stable, callback accessed via ref

    useImperativeHandle(ref, () => ({
      scrollToNextSlide: (currentSlideId: string) => {
        const sections = Array.from(containerRef.current?.querySelectorAll('[data-slide-id]') || []);
        const idx = sections.findIndex(s => s.getAttribute('data-slide-id') === currentSlideId);
        sections[idx + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      scrollToSlide: (slideId: string) => {
        const section = containerRef.current?.querySelector(`[data-slide-id="${slideId}"]`);
        section?.scrollIntoView({ behavior: 'instant', block: 'start' });
      },
      get containerRef() {
        return containerRef.current;
      },
    }));

    return (
      <div
        ref={containerRef}
        className={cn(
          'h-screen scroll-smooth',
          'snap-y snap-mandatory',
          'scrollbar-hide',
          locked ? 'overflow-hidden' : 'overflow-y-scroll',
          className
        )}
      >
        {children}
      </div>
    );
  }
);
