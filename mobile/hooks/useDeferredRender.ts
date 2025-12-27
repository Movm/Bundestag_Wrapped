/**
 * useDeferredRender - Defer heavy content rendering for faster perceived start
 *
 * This hook delays rendering of heavy components (like bubbles) until after
 * a slide becomes visible + a delay passes. This allows header/text to appear
 * first, creating a faster perceived start time.
 *
 * Timeline:
 * - 0ms: Slide becomes visible, header renders immediately
 * - 0-300ms: Header animations play (emoji, title, subtitle)
 * - 300ms: Hook returns true, bubbles start mounting
 * - 300-800ms: Bubbles animate in with stagger
 */

import { useState, useEffect } from 'react';
import { useSlideVisible } from '../stores/slideStore';

/**
 * Defer rendering of heavy content until slide is visible + delay passes
 *
 * @param slideIndex - Index of the slide (for visibility tracking)
 * @param delayMs - Delay in milliseconds before allowing render (default: 300)
 * @returns boolean - Whether heavy content should render
 *
 * @example
 * ```tsx
 * function TopicsRevealSlide({ slideIndex }) {
 *   const showBubbles = useDeferredRender(slideIndex, 300);
 *
 *   return (
 *     <SlideContainer>
 *       <Header /> {// Always renders immediately}
 *       {showBubbles && bubbles.map(...)} {// Deferred by 300ms}
 *     </SlideContainer>
 *   );
 * }
 * ```
 */
export function useDeferredRender(slideIndex: number, delayMs = 300): boolean {
  const isVisible = useSlideVisible(slideIndex);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && !shouldRender) {
      console.log(`[DeferredRender] slide ${slideIndex} scheduling render in ${delayMs}ms`);
      const timer = setTimeout(() => {
        console.log(`[DeferredRender] slide ${slideIndex} FIRE - rendering now`);
        setShouldRender(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }
    // Note: We intentionally don't reset shouldRender when scrolling away.
    // This keeps bubbles visible when scrolling back, avoiding re-animation.
  }, [isVisible, shouldRender, delayMs, slideIndex]);

  return shouldRender;
}
