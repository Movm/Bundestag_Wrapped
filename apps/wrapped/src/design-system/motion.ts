import type { Transition, Variants } from 'motion/react';

/**
 * Entrance motion of the design system.
 *
 * Rules (60 fps): only `opacity` and `transform` move — never width, height,
 * top/left, filter or shadows. Every entrance runs once per slide visit.
 * `MotionConfig reducedMotion="user"` in the story shell drops the transforms
 * for people who ask for reduced motion; only the short fade remains.
 */
export const POP: Transition = { type: 'spring', stiffness: 260, damping: 22, mass: 0.9 };
const FADE: Transition = { duration: 0.35, ease: [0.23, 1, 0.32, 1] };

export const ENTER = {
  rise: { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { ...POP, opacity: FADE } } },
  slide: { hidden: { opacity: 0, x: -96, rotate: -3 }, visible: { opacity: 1, x: 0, rotate: 0, transition: { ...POP, opacity: FADE } } },
  stamp: { hidden: { opacity: 0, scale: 1.8, rotate: -24 }, visible: { opacity: 1, scale: 1, rotate: 0, transition: { ...POP, opacity: FADE } } },
  pop: { hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1, transition: { ...POP, opacity: FADE } } },
  /** Bars and bands grow from their origin; set `transform-origin` on the element. */
  grow: { hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.8, ease: [0.2, 1.2, 0.4, 1] } } },
  /** First headline of a slide: rises out of a clipped line (see `.ds-mask`). No spring, it should lock in. Opacity is what remains for reduced motion. */
  mask: { hidden: { opacity: 0, y: '130%' }, visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.23, 1, 0.32, 1] } } },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: FADE } },
} satisfies Record<string, Variants>;

export type EnterKind = keyof typeof ENTER;

/**
 * After a cut (keyboard, start) there is no scroll to wait for: start at once and
 * run a little tighter. `custom` is the story's arrival ref (see StoryContext).
 */
export const STAGGER: Variants = {
  hidden: {},
  visible: (arrival?: { current: string }) => ({
    transition: arrival?.current === 'instant' ? { staggerChildren: 0.05, delayChildren: 0 } : { staggerChildren: 0.07, delayChildren: 0.04 },
  }),
};

/** Slides enter when about a fifth is on screen, once per mount. */
export const IN_VIEW = { once: true, amount: 0.2 } as const;
