import { startTransition, useCallback, useRef, useImperativeHandle, forwardRef, useLayoutEffect, useEffect, useState, useId, Children, isValidElement, type RefObject, type ReactNode } from 'react';
import { ProgressSegments } from '@/design-system/components/ProgressSegments';
import { surfaceForSlide } from '@/design-system/surfaces';
import { MotionConfig } from 'motion/react';
import { cn } from '@/lib/utils';
import { boundedTarget, isChapterCut, WheelGesture } from './slide-navigation';
import { SurfaceFlood, type SurfaceFloodRef } from './SurfaceFlood';
import { StoryContext, type Arrival } from './StoryContext';

interface ScrollContainerProps {
  children: ReactNode;
  onSectionChange?: (sectionId: string) => void;
  initialSection?: string | null;
  scrollElementRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}
export interface ScrollContainerRef {
  /** `instant` cuts to the next slide instead of scrolling; the arriving slide's own entrance animates. */
  scrollToNextSlide: (currentSlideId: string, instant?: boolean) => void;
  scrollToSlide: (slideId: string) => void;
  containerRef: HTMLDivElement | null;
}

export const ScrollContainer = forwardRef<ScrollContainerRef, ScrollContainerProps>(
  function ScrollContainer({ children, onSectionChange, initialSection, className, scrollElementRef }, ref) {
    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = scrollElementRef ?? internalRef;
    const [readingMode, setReadingMode] = useState(false);
    const reading = useRef(readingMode);
    useLayoutEffect(() => { reading.current = readingMode; }, [readingMode]);
    const [navigationOpen, setNavigationOpen] = useState(false);
    const navigationId = useId();
    const ids = Children.toArray(children).flatMap(child => isValidElement<{ id: string }>(child) ? [child.props.id] : []);
    const sectionKey = ids.join('|');
    useEffect(() => {
      if (!navigationOpen) return;
      const close = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        event.preventDefault(); setNavigationOpen(false); containerRef.current?.focus({ preventScroll: true });
      };
      document.addEventListener('keydown', close);
      return () => document.removeEventListener('keydown', close);
    }, [navigationOpen, containerRef]);
    const callback = useRef(onSectionChange);
    useLayoutEffect(() => { callback.current = onSectionChange; });
    const arrival = useRef<Arrival>('smooth');
    const flood = useRef<SurfaceFloodRef>(null);
    const cancelNavigation = useRef(() => {});
    const controller = useRef({ next: (_id?: string, _instant?: boolean) => {}, previous: (_instant?: boolean) => {}, restore: (_id: string) => {} });
    const [activeId, setActiveId] = useState(initialSection ?? ids[0] ?? '');
    const [position, setPosition] = useState({ index: 0, count: 0, blocked: true });

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-slide-id]'));
      if (!sections.length) return;
      const top = (index: number) => sections[index].getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      const blocked = () => sections.map(section => !reading.current && section.dataset.forwardBlocked === 'true');
      let active = Math.max(0, sections.findIndex(section => section.id === initialSection));
      let target: number | null = null;
      let origin = active;
      let touching = false;
      let touchY = 0;
      let touchX = 0;
      let focusOnArrival = false;
      let focusFrom: Element | null = null;
      const wantFocus = () => { if (!focusOnArrival) focusFrom = document.activeElement; focusOnArrival = true; };
      let stalledAt: number | null = null;
      let timer: ReturnType<typeof setTimeout>;
      let frame = 0;
      let size = { width: container.clientWidth, height: container.clientHeight };
      let contentFraction = 0;
      let readingFraction = 0;
      const gesture = new WheelGesture();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const updatePosition = () => setPosition({ index: active, count: sections.length, blocked: blocked()[active] });
      const commit = () => {
        // A resize may dispatch scrollend before ResizeObserver restores position.
        // Do not replace the saved slide with a neighbour in the new geometry.
        if (touching || frame || size.width !== container.clientWidth || size.height !== container.clientHeight) return;
        if (target !== null && Math.abs(container.scrollTop - top(target)) > 2) {
          // A smooth scroll that is still travelling moves between attempts. One that was
          // overridden (another scrollTo, scrollbar drag, anchor jump) leaves scrollTop
          // where it is and would block every later commit with a stale target.
          if (stalledAt !== container.scrollTop) { stalledAt = container.scrollTop; schedule(); return; }
          target = null;
        }
        stalledAt = null;
        const index = sections.findIndex((section, i) => top(i) <= container.scrollTop + 2 && top(i) + section.offsetHeight > container.scrollTop + 2);
        if (index < 0) return;
        active = index;
        origin = index;
        target = null;
        const focused = document.activeElement;
        // The arriving section is settled; make it focusable before React reconciles inert.
        // Focus the arrival unless the person has since moved focus to another control
        // (for example the slide navigation toggle) while the scroll was settling.
        const focusMoved = focusFrom !== null && focused !== null && focused !== focusFrom && focused !== document.body;
        const shouldFocus = (focusOnArrival && !focusMoved) || (focused instanceof HTMLElement && container.contains(focused) && !sections[active].contains(focused));
        focusOnArrival = false;
        const id = sections[active].id;
        contentFraction = Math.max(0, container.scrollTop - top(active)) / Math.max(1, sections[active].offsetHeight - container.clientHeight);
        readingFraction = (container.scrollTop - top(active) + container.clientHeight / 2) / Math.max(1, sections[active].offsetHeight);
        // Re-rendering the story for the arrival is the biggest update of a step.
        // As a transition React renders it interruptibly, so it never shares a
        // frame with the browser's own work for the scroll (Chrome trace: one
        // partially presented frame on the first arrival otherwise). Focus and
        // inert below are set on the DOM directly and do not wait for it.
        startTransition(() => {
          setActiveId(id);
          callback.current?.(id);
          updatePosition();
        });
        if (shouldFocus) {
          sections[index].inert = false;
          sections[index].removeAttribute('aria-hidden');
          sections[index].focus({ preventScroll: true });
        }
      };
      const schedule = () => { clearTimeout(timer); timer = setTimeout(commit, 140); };
      const navigate = (requested: number, instant = false, restore = false) => {
        const index = restore ? Math.max(0, Math.min(requested, sections.length - 1)) : boundedTarget(active, requested, blocked());
        target = index;
        arrival.current = instant || reduced.matches ? 'instant' : 'smooth';
        if (instant) wantFocus();
        // Only a deliberate cut into a new chapter gets a colour flood: not a restore, not a move inside a chapter.
        if (instant && !restore && !reduced.matches && index !== active && isChapterCut(sections[active].id, sections[index].id)) {
          const trigger = document.activeElement instanceof HTMLButtonElement ? document.activeElement.getBoundingClientRect() : null;
          flood.current?.play(surfaceForSlide(sections[active].id), surfaceForSlide(sections[index].id),
            trigger ? { x: trigger.left + trigger.width / 2, y: trigger.top + trigger.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight * 0.85 });
        }
        container.scrollTo({ top: top(index), behavior: instant || reduced.matches ? 'instant' : 'smooth' });
        schedule();
      };
      const withinContent = (direction: number) => direction > 0
        ? container.scrollTop + container.clientHeight < top(active) + sections[active].offsetHeight - 2
        : container.scrollTop > top(active) + 2;
      const step = (direction: number, instant = false) => {
        if (target === null && withinContent(direction)) {
          const end = top(active) + Math.max(0, sections[active].offsetHeight - container.clientHeight);
          container.scrollTo({ top: Math.max(top(active), Math.min(end, container.scrollTop + direction * container.clientHeight * 0.8)), behavior: instant || reduced.matches ? 'instant' : 'smooth' });
          schedule();
          return;
        }
        navigate((target ?? active) + direction, instant);
      };
      const wheel = (event: WheelEvent) => {
        if (reading.current || event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        if (target === null && withinContent(Math.sign(event.deltaY))) return;
        event.preventDefault();
        const delta = event.deltaY * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? container.clientHeight : 1);
        const direction = gesture.push(delta, performance.now());
        if (direction) step(direction);
      };
      const key = (event: KeyboardEvent) => {
        if (reading.current || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
        const control = (event.target as HTMLElement).closest('button, input, textarea, select, a, [contenteditable="true"], [role="dialog"]');
        // An answered quiz option is inert (aria-disabled) and keeps focus, so the keys move the story on from there.
        if (control && control.getAttribute('aria-disabled') !== 'true') return;
        // Also support keyboard navigation before the first pointer interaction.
        if (event.target !== document.body && !container.contains(event.target as Node)) return;
        const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? (event.shiftKey ? -1 : 1)
          : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        if (!event.repeat) step(direction, true);
      };
      const touchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return;
        touching = true;
        arrival.current = 'smooth';
        touchY = event.touches[0].clientY;
        touchX = event.touches[0].clientX;
        target = null;
        origin = active;
      };
      const touchMove = (event: TouchEvent) => {
        if (event.touches.length !== 1) return;
        const dy = touchY - event.touches[0].clientY;
        const dx = touchX - event.touches[0].clientX;
        if (!reading.current && dy > 0 && Math.abs(dy) > Math.abs(dx) && blocked()[active] && !withinContent(1)) event.preventDefault();
      };
      const touchEnd = () => { touching = false; schedule(); };
      const scroll = () => {
        if (target === null && !reading.current) {
          // Native touch, scrollbar and accessibility scrolls obey the same gates.
          const upper = boundedTarget(origin, origin + 1, blocked());
          const max = top(upper) + (upper === origin ? Math.max(0, sections[origin].offsetHeight - container.clientHeight) : 0);
          const min = top(Math.max(0, origin - 1));
          if (container.scrollTop > max + 2 || container.scrollTop < min - 2) {
            container.scrollTo({ top: Math.max(min, Math.min(max, container.scrollTop)), behavior: 'instant' });
          }
        }
        schedule();
      };
      const resize = new ResizeObserver(() => {
        const changed = size.width !== container.clientWidth || size.height !== container.clientHeight;
        if (!changed) { schedule(); return; }
        size = { width: container.clientWidth, height: container.clientHeight };
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = 0;
          container.scrollTo({ top: top(target ?? active) + (target === null ? reading.current ? readingFraction * sections[active].offsetHeight - container.clientHeight / 2 : contentFraction * Math.max(0, sections[active].offsetHeight - container.clientHeight) : 0), behavior: 'instant' });
          commit();
        });
      });
      resize.observe(container);
      sections.forEach(section => resize.observe(section));
      const gates = new MutationObserver(updatePosition);
      sections.forEach(section => gates.observe(section, { attributes: true, attributeFilter: ['data-forward-blocked'] }));
      cancelNavigation.current = () => {
        target = null;
        focusOnArrival = false;
        container.scrollTo({ top: container.scrollTop, behavior: 'instant' });
        schedule();
      };
      controller.current = {
        next: (id, instant = false) => {
          // A request made for a slide (intro launch) is stale once the scroll position has left it,
          // even if the settled `active` has not caught up yet.
          const at = container.scrollTop + 2;
          if (id && (sections[active].id !== id || at < top(active) || at >= top(active) + sections[active].offsetHeight)) return;
          wantFocus();
          if (id) navigate(active + 1, instant); else step(1, instant);
        },
        previous: (instant = false) => { wantFocus(); step(-1, instant); },
        restore: id => { const index = sections.findIndex(section => section.id === id); if (index >= 0) navigate(index, true, true); },
      };
      container.scrollTo({ top: top(active), behavior: 'instant' });
      commit();
      container.addEventListener('wheel', wheel, { passive: false });
      document.addEventListener('keydown', key);
      container.addEventListener('scroll', scroll, { passive: true });
      container.addEventListener('scrollend', commit);
      container.addEventListener('touchstart', touchStart, { passive: true });
      container.addEventListener('touchmove', touchMove, { passive: false });
      container.addEventListener('touchend', touchEnd);
      container.addEventListener('touchcancel', touchEnd);
      return () => {
        clearTimeout(timer); cancelAnimationFrame(frame); resize.disconnect(); gates.disconnect();
        container.removeEventListener('wheel', wheel); document.removeEventListener('keydown', key);
        container.removeEventListener('scroll', scroll); container.removeEventListener('scrollend', commit);
        container.removeEventListener('touchstart', touchStart); container.removeEventListener('touchmove', touchMove);
        container.removeEventListener('touchend', touchEnd); container.removeEventListener('touchcancel', touchEnd);
      };
    }, [initialSection, containerRef, sectionKey]);

    useImperativeHandle(ref, () => ({
      scrollToNextSlide: (id, instant) => controller.current.next(id, instant),
      scrollToSlide: id => controller.current.restore(id),
      get containerRef() { return containerRef.current; },
    }), [containerRef]);

    const goNext = useCallback((fromId: string) => controller.current.next(fromId), []);

    return (
      <MotionConfig reducedMotion="user">
        <div className="story-shell">
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Safari needs an explicit keyboard scroll target. */}
          <div ref={containerRef} data-story-scroll tabIndex={0} role="region" aria-label="Wrapped-Folien"
            data-reading-mode={readingMode}
            className={cn('story-scroll relative overflow-y-auto overscroll-contain', className)}>
            <StoryContext value={{ activeId, readingMode, next: goNext, arrival }}>{children}</StoryContext>
          </div>
          <SurfaceFlood ref={flood} />
          <ProgressSegments index={position.index} count={position.count} surface={surfaceForSlide(activeId)} />
          <span className="sr-only" role="status" aria-live="polite">Folie {position.index + 1} von {position.count}</span>
          {position.index > 0 && !position.blocked && position.index < position.count - 1 && !navigationOpen && <button
            type="button" className="story-next ds-button ds-button--contrast ds-contrast" data-surface={surfaceForSlide(activeId)} aria-label="Weiter zur nächsten Folie"
            onClick={event => controller.current.next(undefined, event.detail === 0)}>Weiter<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg></button>}
          <button type="button" className="story-navigation-toggle" aria-expanded={navigationOpen}
            aria-controls={navigationId} onClick={() => {
              if (navigationOpen) containerRef.current?.focus({ preventScroll: true });
              setNavigationOpen(!navigationOpen);
            }}>{navigationOpen ? 'Navigation schließen' : 'Foliennavigation'}</button>
          <nav id={navigationId} hidden={!navigationOpen} aria-label="Foliennavigation" className="story-navigation">
            <button type="button" disabled={position.index === 0} onClick={event => controller.current.previous(event.detail === 0)}>Zur vorherigen Folie</button>
            <span className="text-xs text-white/80" aria-hidden="true">Folie {position.index + 1} von {position.count}</span>
            <button type="button" disabled={(!readingMode && position.blocked) || position.index === position.count - 1} onClick={event => controller.current.next(undefined, event.detail === 0)}>Weiter</button>
            <label className="flex items-center justify-center gap-2 min-h-11 text-sm col-span-3">
              <input type="checkbox" checked={readingMode} onChange={event => { cancelNavigation.current(); setReadingMode(event.target.checked); }} />
              Lesemodus (alle Folien)
            </label>
          </nav>
        </div>
      </MotionConfig>
    );
  }
);
