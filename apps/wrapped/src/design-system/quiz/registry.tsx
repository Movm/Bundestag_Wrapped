import { FITS, type QuizLayoutSpec } from './layouts';
import { StackLayout } from './layouts/StackLayout';
import { TilesLayout } from './layouts/TilesLayout';

/**
 * All quiz layouts and when they fit. Order matters only for the rotation.
 * Short single words look best as huge type (stack); anything long, names,
 * party labels or emoji fall back to tiles, which fit every answer.
 */
export const QUIZ_LAYOUT_REGISTRY: readonly QuizLayoutSpec[] = [
  { id: 'stack', component: StackLayout, fits: options => FITS.count(options, 2, 4) && FITS.shortLabels(options, 12) },
  { id: 'tiles', component: TilesLayout, fits: () => true },
];
