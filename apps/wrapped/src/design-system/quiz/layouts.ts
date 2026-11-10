import type { ComponentType } from 'react';
import type { QuizEngine } from './engine';

/**
 * Quiz layouts are interchangeable views over one QuizEngine. To add a layout:
 *   1. write a component taking QuizLayoutProps (render every option as a native
 *      <button> via <QuizChoice>, or follow its rules: aria-disabled after answering,
 *      focus stays, status word as text),
 *   2. register it in QUIZ_LAYOUT_REGISTRY (quiz/registry.tsx) with its constraints.
 * Nothing else changes — every quiz can then use it via `layout` or the rotation.
 */
export const QUIZ_LAYOUTS = ['stack', 'tiles', 'fan', 'gap', 'quadrants', 'stickers', 'swipe'] as const;
export type QuizLayoutId = (typeof QUIZ_LAYOUTS)[number];

export interface QuizLayoutProps {
  engine: QuizEngine;
  /** id of the question heading, for aria-labelledby on the option group. */
  questionId: string;
  /** "Platz 1 ist {answer}." — only the gap layout uses it. */
  gapSentence?: string;
}

export interface QuizLayoutSpec {
  id: QuizLayoutId;
  component: ComponentType<QuizLayoutProps>;
  /** Is this layout a good fit for these options? */
  fits: (options: string[], context: { gapSentence?: string }) => boolean;
}

const longest = (options: string[]) => Math.max(0, ...options.map(option => option.length));

/** Shared constraints, exported so tests and layouts agree on them. */
export const FITS = {
  shortLabels: (options: string[], max: number) => longest(options) <= max,
  count: (options: string[], min: number, max: number) => options.length >= min && options.length <= max,
};

/** Deterministic, so a quiz keeps its layout across reloads and SSR. */
export function hashSeed(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/**
 * Picks a layout: an explicit choice wins if it fits; otherwise rotate over the
 * fitting layouts by seed (slide id), so neighbouring quizzes look different.
 * `tiles` fits everything and is the final fallback.
 */
export function pickQuizLayout(
  registry: readonly QuizLayoutSpec[],
  options: string[],
  { preferred, seed, gapSentence }: { preferred?: QuizLayoutId; seed: string; gapSentence?: string },
): QuizLayoutSpec {
  const fitting = registry.filter(spec => spec.fits(options, { gapSentence }));
  const chosen = preferred && fitting.find(spec => spec.id === preferred);
  if (chosen) return chosen;
  const pool = fitting.filter(spec => spec.id !== 'gap' || gapSentence);
  return pool[hashSeed(seed) % Math.max(1, pool.length)] ?? registry.find(spec => spec.id === 'tiles')!;
}
