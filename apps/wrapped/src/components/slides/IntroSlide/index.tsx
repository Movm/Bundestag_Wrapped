import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useSlideEffectsActive } from '@/components/main-wrapped/SlideEffectsContext';
import { playSound } from '@/lib/sounds';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { acquireCover, releaseBootShell } from '@/cover/shell';
import type { CoverController } from '@/cover/cover';

interface IntroSlideProps {
  onStart?: () => void;
}

/**
 * Cover ("Start Sitzreihen"). The cover itself is framework-free
 * (src/cover/cover.ts) and usually already painted by the inline boot script;
 * this slide adopts that element, so the first visit never waits for React.
 */
export const IntroSlide = memo(function IntroSlide({ onStart }: IntroSlideProps) {
  const year = editionSurface(useOptionalEdition()).year;
  const active = useSlideEffectsActive();
  const hostRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<CoverController | null>(null);
  const onStartRef = useRef(onStart);
  useLayoutEffect(() => { onStartRef.current = onStart; });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const bootHost = window.__btCover?.host ?? null;
    const { controller, startRequested } = acquireCover();
    const hadFocus = controller.root.contains(document.activeElement);
    host.appendChild(controller.root);
    releaseBootShell(bootHost);
    if (hadFocus) controller.root.querySelector<HTMLButtonElement>('.cv-start')?.focus({ preventScroll: true });
    controller.onPress = () => playSound('start');
    controller.onStart = () => onStartRef.current?.();
    coverRef.current = controller;
    // "Starten" was pressed on the boot cover before the story was ready.
    if (startRequested) onStartRef.current?.();
    return () => { controller.onStart = null; controller.onPress = null; };
  }, []);

  useEffect(() => { coverRef.current?.setYear(year ? String(year) : null); }, [year]);

  useEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;
    if (active) cover.resume();
    else cover.pause();
  }, [active]);

  return <div ref={hostRef} className="h-full w-full" />;
});
