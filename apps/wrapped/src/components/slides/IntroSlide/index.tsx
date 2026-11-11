import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useSlideEffectsActive } from '@/components/main-wrapped/SlideEffectsContext';
import { playSound } from '@/lib/sounds';
import { themeMusic } from '@/lib/theme-music';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { previewProtocolsLabel } from '@/edition/labels';
import { capitalize, cardinal } from '@/lib/german-count';
import { acquireCover, releaseBootShell } from '@/cover/shell';
import type { CoverController } from '@/cover/cover';

interface IntroSlideProps {
  onStart?: () => void;
  /** Active quiz questions, spelled out in the tagline; omitted until known. */
  questionCount?: number;
}

/**
 * Cover ("Start Sitzreihen"). The cover itself is framework-free
 * (src/cover/cover.ts) and usually already painted by the inline boot script;
 * this slide adopts that element, so the first visit never waits for React.
 */
export const IntroSlide = memo(function IntroSlide({ onStart, questionCount = 0 }: IntroSlideProps) {
  const edition = useOptionalEdition();
  const year = editionSurface(edition).year;
  const note = previewProtocolsLabel(edition?.manifest);
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
    // Inside the "Los geht’s" click: the only moment every browser lets music start.
    controller.onPress = () => { playSound('start'); themeMusic.startPrimed(); };
    // Silent on a first visit (no press yet, browsers forbid sound); heard after "Neu starten".
    controller.onAssemble = () => playSound('assemble');
    controller.onStart = () => onStartRef.current?.();
    coverRef.current = controller;
    // "Los geht’s" was pressed on the boot cover before the story was ready.
    if (startRequested) onStartRef.current?.();
    return () => { controller.onStart = null; controller.onPress = null; controller.onAssemble = null; };
  }, []);

  useEffect(() => { coverRef.current?.setYear(year ? String(year) : null); }, [year]);
  useEffect(() => {
    coverRef.current?.setQuestions(questionCount > 1 ? `${capitalize(cardinal(questionCount))} Fragen.` : null);
  }, [questionCount]);
  useEffect(() => { coverRef.current?.setNote(note); }, [note]);

  useEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;
    if (active) cover.resume();
    else cover.pause();
  }, [active]);

  return <div ref={hostRef} className="h-full w-full" />;
});
