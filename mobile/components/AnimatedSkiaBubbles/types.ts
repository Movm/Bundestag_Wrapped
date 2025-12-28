/**
 * AnimatedSkiaBubbles Types
 *
 * Configuration for GPU-accelerated animated bubbles with integrated text.
 */

import type { SharedValue } from 'react-native-reanimated';

export interface AnimatedBubbleConfig {
  /** Unique identifier for the bubble */
  id: string;
  /** Center X position in pixels */
  x: number;
  /** Center Y position in pixels */
  y: number;
  /** Bubble diameter in pixels */
  size: number;
  /** Hex color for the bubble fill */
  color: string;
  /** Main text displayed in bubble (e.g., rank, word, count) */
  frontText: string;
  /** Optional secondary text below main text */
  frontSubtext?: string;
  /** Optional emoji displayed above text (for ToneRevealSlide) */
  emoji?: string;
}

export interface AnimatedSkiaBubblesProps {
  /** Array of bubble configurations */
  bubbles: AnimatedBubbleConfig[];
  /** Animation progress SharedValue (0 to 1) - controlled externally */
  progress: SharedValue<number>;
  /** Phase offset per bubble for staggered entrance (default: 0.12) */
  phaseOffset?: number;
  /** Font size for main text (default: 28) */
  fontSize?: number;
  /** Font size for subtext (default: 13) */
  subtextFontSize?: number;
  /** Array of flip progress values - when provided, bubbles fade out as they flip */
  flipProgresses?: SharedValue<number>[];
}

export interface AnimatedBubbleProps {
  config: AnimatedBubbleConfig;
  index: number;
  totalBubbles: number;
  progress: SharedValue<number>;
  phaseOffset: number;
  flipProgress?: SharedValue<number>;
}
