import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useSlideEffectsActive } from '@/components/main-wrapped/SlideEffectsContext';
import { playSound } from '@/lib/sounds';
import { themeMusic } from '@/lib/theme-music';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import { isNativeShell, onNativeMessage } from '@/lib/native-shell';
import { usePageVisible } from '@/hooks/usePageVisible';
import { reportCover } from '@/lib/native-cover';
import { useAudioStore } from '@/stores/audioStore';
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
  const edition = useOptionalEdition();
  const year = editionSurface(edition).year;
  const active = useSlideEffectsActive();
  const native = isNativeShell();
  const muted = useAudioStore(state => state.isMuted);
  const hostRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<CoverController | null>(null);
  const onStartRef = useRef(onStart);
  useLayoutEffect(() => { onStartRef.current = onStart; });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || native) return;
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
    // Like the quiz options; silent until the first press, as every sound is.
    controller.onHover = () => playSound('hover');
    controller.onStart = () => onStartRef.current?.();
    coverRef.current = controller;
    // "Los geht’s" was pressed on the boot cover before the story was ready.
    if (startRequested) onStartRef.current?.();
    return () => { controller.onStart = null; controller.onPress = null; controller.onHover = null; controller.onAssemble = null; };
  }, [native]);

  useEffect(() => { coverRef.current?.setYear(year ? String(year) : null); }, [year]);

  useEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;
    if (active) cover.resume();
    else cover.pause();
  }, [active]);

  // Native shell: it paints the cover; this slide only reports visibility and relays "Los geht's".
  // `active` is false while the page is hidden (app switch), but backgrounding does not leave the
  // cover: the last report holds until the page is visible again, so native neither hides the cover
  // nor replays its assembly on return, and a press in flight still lands.
  const pageVisible = usePageVisible();
  const reportRef = useRef({ year: year ?? null, muted });
  const startedRef = useRef(false);
  /** What this slide last told native; only a cover reported visible takes "Los geht's". */
  const reportedVisibleRef = useRef(false);
  /** Counts this slide's moves to a reported-visible cover. */
  const coverEpochRef = useRef(0);
  /** The cover report when the story.start listener went away; `null` until it did once. */
  const unsubscribedAtRef = useRef<{ epoch: number; visible: boolean } | null>(null);
  useEffect(() => {
    if (!native) return;
    reportRef.current = { year: year ?? null, muted };
    if (!pageVisible) return;
    // Only the move to visible re-arms "Los geht's"; a mute or year change inside the same visible period must not.
    if (active && !reportedVisibleRef.current) {
      coverEpochRef.current += 1;
      startedRef.current = false;
    }
    reportedVisibleRef.current = active;
    reportCover({ visible: active, ...reportRef.current });
  }, [native, active, year, muted, pageVisible]);
  useEffect(() => {
    if (!native) return;
    // native-shell hands over story.start messages that came while nobody listened. They answer a
    // cover this slide still shows only if it stayed reported visible since the listener went away;
    // anything older (before this mount, or before the cover went and came back) is dropped.
    const before = unsubscribedAtRef.current;
    const bufferCurrent = before !== null && before.visible && before.epoch === coverEpochRef.current;
    let draining = true;
    const off = onNativeMessage('story.start', () => {
      if (draining && !bufferCurrent) return;
      if (!reportedVisibleRef.current || startedRef.current) return;
      startedRef.current = true;
      themeMusic.startPrimed();
      onStartRef.current?.();
    });
    draining = false;
    return () => {
      off();
      unsubscribedAtRef.current = { epoch: coverEpochRef.current, visible: reportedVisibleRef.current };
      // The Activity hid a backgrounded slide: the cover is still on.
      if (document.visibilityState === 'hidden') return;
      reportedVisibleRef.current = false;
      reportCover({ visible: false, ...reportRef.current });
    };
  }, [native]);

  if (native) return <div className="h-full w-full" style={{ background: '#0e0a14' }} />;
  return <div ref={hostRef} className="h-full w-full" />;
});
