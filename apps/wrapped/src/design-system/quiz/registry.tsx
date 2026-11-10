import { FITS, type QuizLayoutSpec } from './layouts';
import { FanLayout } from './layouts/FanLayout';
import { GAP_MARK, GapLayout } from './layouts/GapLayout';
import { QuadrantsLayout } from './layouts/QuadrantsLayout';
import { StackLayout } from './layouts/StackLayout';
import { StickersLayout } from './layouts/StickersLayout';
import { SwipeLayout } from './layouts/SwipeLayout';
import { TilesLayout } from './layouts/TilesLayout';

/**
 * All quiz layouts and when they fit. Order matters only for the rotation:
 * it alternates dark/loud/playful layouts so neighbouring quizzes differ.
 * Short single words look best as huge type (stack); anything long, names,
 * party labels or emoji fall back to tiles, which fit every answer.
 */
export const QUIZ_LAYOUT_REGISTRY: readonly QuizLayoutSpec[] = [
  { id: 'stack', component: StackLayout, fits: options => FITS.count(options, 2, 4) && FITS.shortLabels(options, 12) },
  { id: 'fan', component: FanLayout, fits: options => FITS.count(options, 3, 4) && FITS.shortLabels(options, 14) },
  { id: 'quadrants', component: QuadrantsLayout, fits: options => options.length === 4 && FITS.shortLabels(options, 16) },
  { id: 'swipe', component: SwipeLayout, optIn: true, fits: options => FITS.count(options, 2, 5) },
  { id: 'gap', component: GapLayout, optIn: true, fits: (options, { gapSentence }) => Boolean(gapSentence?.includes(GAP_MARK)) && FITS.count(options, 2, 6) },
  { id: 'stickers', component: StickersLayout, fits: options => FITS.count(options, 2, 6) && FITS.shortLabels(options, 18) },
  { id: 'tiles', component: TilesLayout, fits: () => true },
];
