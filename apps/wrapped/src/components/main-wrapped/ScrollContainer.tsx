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
    const lastWheelRef = useRef({ time: 0, direction: 0 });
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

        sections[index].scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      }
    }, [getSections]);

    // Commit the active slide only after scrolling settles. Position-based
    // selection also works for slides taller than the viewport.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      let timer: ReturnType<typeof setTimeout>;
      const commit = () => {
        const top = container.getBoundingClientRect().top;
        const sections = getSections();
        const section = sections.find(element => {
          const rect = element.getBoundingClientRect();
          return rect.top <= top + 2 && rect.bottom > top + 2;
        }) ?? sections[0];
        const id = section?.getAttribute('data-slide-id');
        if (id && id !== currentSectionRef.current) {
          currentSectionRef.current = id;
          onSectionChangeRef.current?.(id);
        }
      };
      const schedule = () => { clearTimeout(timer); timer = setTimeout(commit, 120); };
      container.addEventListener('scroll', schedule, { passive: true });
      container.addEventListener('scrollend', commit);
      commit();
      return () => {
        clearTimeout(timer);
        container.removeEventListener('scroll', schedule);
        container.removeEventListener('scrollend', commit);
      };
    }, [getSections]);

    // Wheel event handler for controlled slide-by-slide scrolling
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        if (lockedRef.current && e.deltaY > 0) { e.preventDefault(); return; }

        // A wheel gesture includes its momentum tail. Only a fresh gesture or
        // an explicit reversal may request another slide.
        const sections = getSections();
        const active = sections[getCurrentIndex()] as HTMLElement | undefined;
        if (active && active.offsetHeight > container.clientHeight + 2) {
          const top = active.getBoundingClientRect().top - container.getBoundingClientRect().top;
          if ((e.deltaY > 0 && top + active.offsetHeight > container.clientHeight + 2) ||
              (e.deltaY < 0 && top < -2)) return;
        }
        const now = performance.now();
        const direction = Math.sign(e.deltaY);
        const previous = lastWheelRef.current;
        const fresh = now - previous.time > 180 || direction !== previous.direction;
        lastWheelRef.current = { time: now, direction };
        if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        if (fresh) {
          accumulatedDeltaRef.current = 0;
          isScrollingRef.current = false;
        }
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

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      let touchY = 0;
      const start = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? 0; };
      const move = (event: TouchEvent) => {
        if (lockedRef.current && (event.touches[0]?.clientY ?? touchY) < touchY) event.preventDefault();
      };
      const key = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
            (event.target as HTMLElement).closest('button, input, textarea, select, a, [contenteditable="true"]')) return;
        const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? (event.shiftKey ? -1 : 1)
          : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        if (direction > 0 && lockedRef.current) return;
        scrollToIndex(getCurrentIndex() + direction);
      };
      container.addEventListener('touchstart', start, { passive: true });
      container.addEventListener('touchmove', move, { passive: false });
      container.addEventListener('keydown', key);
      return () => {
        container.removeEventListener('touchstart', start);
        container.removeEventListener('touchmove', move);
        container.removeEventListener('keydown', key);
      };
    }, [getCurrentIndex, scrollToIndex]);

    useImperativeHandle(ref, () => ({
      scrollToNextSlide: (currentSlideId: string) => {
        // Set scrolling flag to prevent wheel interference
        isScrollingRef.current = true;


        const sections = Array.from(containerRef.current?.querySelectorAll('[data-slide-id]') || []);
        const idx = sections.findIndex(s => s.getAttribute('data-slide-id') === currentSlideId);
        sections[idx + 1]?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
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
        role="region"
        aria-label="Bundestag Wrapped"
        className={cn(
          'h-dvh scroll-smooth overscroll-y-contain',
          'snap-y snap-mandatory',
          'scrollbar-hide',
          'overflow-y-scroll',
          className
        )}
      >
        {children}
        {!locked && <button type="button" aria-label="Nächste Slide"
          className="fixed bottom-4 right-4 z-40 rounded-full bg-black/70 px-4 py-2 text-sm text-white focus-visible:outline-2"
          onClick={() => scrollToIndex(getCurrentIndex() + 1)}>Weiter ↓</button>}
      </div>
    );
  }
);
