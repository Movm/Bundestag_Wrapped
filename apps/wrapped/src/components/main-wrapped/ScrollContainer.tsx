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

    // Mirror locked prop in ref for synchronous access in wheel handler
    const lockedRef = useRef(locked);
    useEffect(() => {
      lockedRef.current = locked;
    }, [locked]);

    // Wheel scroll state
    const currentSectionRef = useRef<string | null>(null);
    const isScrollingRef = useRef(false);
    const accumulatedDeltaRef = useRef(0);
    const deltaResetTimeoutRef = useRef<number | undefined>(undefined);

    // Helper: get all slide sections
    const getSections = useCallback(() => {
      return Array.from(containerRef.current?.querySelectorAll('[data-slide-id]') || []);
    }, []);

    // Helper: get current section index
    const getCurrentIndex = useCallback(() => {
      const sections = getSections();
      return sections.findIndex(s => s.getAttribute('data-slide-id') === currentSectionRef.current);
    }, [getSections]);

    // Helper: scroll to a specific index
    const scrollToIndex = useCallback((index: number) => {
      const sections = getSections();
      if (index >= 0 && index < sections.length) {
        isScrollingRef.current = true;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, SCROLL_COOLDOWN);
        sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, [getSections]);

    // IntersectionObserver to track which section is visible
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              const id = entry.target.getAttribute('data-slide-id');
              if (id) {
                currentSectionRef.current = id;
                onSectionChangeRef.current?.(id);
              }
            }
          }
        },
        { root: containerRef.current, threshold: 0.5 }
      );

      const sections = containerRef.current.querySelectorAll('[data-slide-id]');
      sections.forEach((section) => observer.observe(section));

      return () => observer.disconnect();
    }, []); // Empty deps - observer is stable, callback accessed via ref

    // Wheel event handler for controlled slide-by-slide scrolling
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
        // Don't intercept if locked (quiz slides, intro before start)
        if (lockedRef.current) return;

        // Don't intercept during programmatic scroll (cooldown active)
        if (isScrollingRef.current) {
          e.preventDefault();
          return;
        }

        // Normalize delta for different input devices
        // deltaMode: 0 = pixels (trackpad), 1 = lines (mouse wheel), 2 = pages
        let normalizedDelta = e.deltaY;
        if (e.deltaMode === 1) {
          normalizedDelta *= 40;
        } else if (e.deltaMode === 2) {
          normalizedDelta *= 800;
        }

        // Clear existing reset timeout
        if (deltaResetTimeoutRef.current) {
          window.clearTimeout(deltaResetTimeoutRef.current);
        }

        // Accumulate delta
        accumulatedDeltaRef.current += normalizedDelta;

        // Check if threshold reached
        if (Math.abs(accumulatedDeltaRef.current) >= SCROLL_THRESHOLD) {
          const direction = accumulatedDeltaRef.current > 0 ? 1 : -1;
          const currentIndex = getCurrentIndex();
          const sections = getSections();
          const targetIndex = currentIndex + direction;

          // Reset accumulator
          accumulatedDeltaRef.current = 0;

          // Boundary check: don't scroll past first/last slide
          if (targetIndex < 0 || targetIndex >= sections.length) {
            return;
          }

          // Prevent default and navigate
          e.preventDefault();
          scrollToIndex(targetIndex);
        } else {
          // Prevent partial scrolling while accumulating
          e.preventDefault();

          // Reset accumulator after period of no wheel events
          deltaResetTimeoutRef.current = window.setTimeout(() => {
            accumulatedDeltaRef.current = 0;
          }, DELTA_RESET_DELAY);
        }
      };

      // Use passive: false to allow preventDefault
      container.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        container.removeEventListener('wheel', handleWheel);
        if (deltaResetTimeoutRef.current) {
          window.clearTimeout(deltaResetTimeoutRef.current);
        }
      };
    }, [getCurrentIndex, getSections, scrollToIndex]);

    useImperativeHandle(ref, () => ({
      scrollToNextSlide: (currentSlideId: string) => {
        // Set scrolling flag to prevent wheel interference
        isScrollingRef.current = true;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, SCROLL_COOLDOWN);

        const sections = Array.from(containerRef.current?.querySelectorAll('[data-slide-id]') || []);
        const idx = sections.findIndex(s => s.getAttribute('data-slide-id') === currentSlideId);
        sections[idx + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      scrollToSlide: (slideId: string) => {
        // Shorter cooldown for instant scrolls (e.g., restore position)
        isScrollingRef.current = true;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 100);

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
