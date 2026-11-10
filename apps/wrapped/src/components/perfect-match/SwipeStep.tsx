import { useEffect, useRef, type CSSProperties, type MutableRefObject } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react';
import { ENTER, POP } from '@/design-system/motion';
import type { MatchAnimal } from '@/lib/perfect-match';

const CARD_COLORS = [['var(--color-wr-violet)', '#fff'], ['var(--color-wr-pink)', 'var(--color-wr-ink)'], ['#fff', 'var(--color-wr-ink)'], ['var(--color-wr-mint)', 'var(--color-wr-ink)']];
/** Release past this distance, or flick faster than this speed, to decide. */
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 600;
const VISIBLE_DEPTH = 3;

type Fling = (direction: 1 | -1) => void;

function Card({ animal, index, depth, flingRef, onDecide }: { animal: MatchAnimal; index: number; depth: number; flingRef: MutableRefObject<Fling | null>; onDecide: (direction: 1 | -1) => void }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-12, 12]);
  const likeOpacity = useTransform(x, [0, SWIPE_DISTANCE], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_DISTANCE, 0], [1, 0]);
  const top = depth === 0;
  const busy = useRef(false);

  useEffect(() => {
    if (!top) return;
    const fling: Fling = direction => {
      if (busy.current) return;
      busy.current = true;
      if (reduce) { onDecide(direction); return; }
      void animate(x, direction * Math.max(window.innerWidth, 600), { duration: 0.38, ease: [0.4, 0, 1, 1] }).then(() => onDecide(direction));
    };
    flingRef.current = fling;
    return () => { if (flingRef.current === fling) flingRef.current = null; };
  }, [top, reduce, x, flingRef, onDecide]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const decided = Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    if (decided) flingRef.current?.(info.offset.x > 0 ? 1 : -1);
    else void animate(x, 0, POP);
  };

  const [bg, ink] = CARD_COLORS[index % CARD_COLORS.length];
  return (
    <motion.div
      className="pm-swipe__card"
      data-top={top}
      aria-hidden={!top}
      style={{ x, rotate, zIndex: VISIBLE_DEPTH - depth, '--pm-card': bg, '--pm-card-ink': ink } as unknown as CSSProperties}
      initial={false}
      animate={{ y: depth * 16, scale: 1 - depth * 0.05 }}
      transition={POP}
      drag={top ? 'x' : false}
      dragMomentum={false}
      onDragEnd={top ? onDragEnd : undefined}
    >
      <motion.span className="pm-swipe__stamp pm-swipe__stamp--like" style={{ opacity: likeOpacity }} aria-hidden="true">LIKE</motion.span>
      <motion.span className="pm-swipe__stamp pm-swipe__stamp--nope" style={{ opacity: nopeOpacity }} aria-hidden="true">NOPE</motion.span>
      <span className="pm-swipe__emoji" aria-hidden="true">{animal.emoji}</span>
      <span className="pm-swipe__name">{animal.name}</span>
    </motion.div>
  );
}

/**
 * Step 4: Tinder-style deck. The top card's x is a motion value; tilt and the
 * LIKE/NOPE stamps are derived from it, so a drag never renders React. Buttons
 * and the arrow keys fling the same card.
 */
export function SwipeStep({ animals, decided, onDecide }: { animals: MatchAnimal[]; decided: number; onDecide: (direction: 1 | -1) => void }) {
  const flingRef = useRef<Fling | null>(null);
  const current = animals[decided];
  const visible = animals.slice(decided, decided + VISIBLE_DEPTH);

  return (
    <>
      <motion.h1 variants={ENTER.rise} className="pm__title">Swipe dein Spirit Animal</motion.h1>
      <motion.div
        variants={ENTER.slide}
        className="pm-swipe__stack"
        tabIndex={0}
        role="group"
        aria-roledescription="Kartenstapel"
        aria-label={current ? `${current.name}, Karte ${decided + 1} von ${animals.length}. Pfeil rechts für Like, links für Nope.` : 'Alle Karten entschieden'}
        onKeyDown={event => {
          if (event.key === 'ArrowRight') { event.preventDefault(); flingRef.current?.(1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); flingRef.current?.(-1); }
        }}
      >
        {visible.map((animal, depth) => (
          <Card key={animal.id} animal={animal} index={decided + depth} depth={depth} flingRef={flingRef} onDecide={onDecide} />
        ))}
      </motion.div>
      <div className="pm-swipe__buttons">
        <button type="button" className="pm-swipe__btn pm-swipe__btn--nope" aria-label={current ? `Nope: ${current.name}` : 'Nope'} disabled={!current} onClick={() => flingRef.current?.(-1)}>
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <button type="button" className="pm-swipe__btn pm-swipe__btn--like" aria-label={current ? `Like: ${current.name}` : 'Like'} disabled={!current} onClick={() => flingRef.current?.(1)}>
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3.2 4 7 4c2.2 0 3.6 1.2 5 3 1.4-1.8 2.8-3 5-3 3.8 0 6.1 4 4.6 7.6C19.5 16.4 12 21 12 21z" /></svg>
        </button>
      </div>
    </>
  );
}
