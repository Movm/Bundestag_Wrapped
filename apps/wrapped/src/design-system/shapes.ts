import type { SlideRole } from './surfaces';

export const SHAPE_PRESETS = ['cover', 'orbit', 'band', 'ring', 'corner', 'none'] as const;
export type ShapePreset = (typeof SHAPE_PRESETS)[number];

export const ROLE_SHAPES: Record<SlideRole, ShapePreset> = {
  cover: 'cover',
  section: 'orbit',
  quiz: 'band',
  info: 'ring',
  reveal: 'corner',
  share: 'ring',
  finale: 'cover',
};
