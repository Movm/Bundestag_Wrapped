const MAX_SEGMENTS = 10;

/** Fill (0…1) of each segment for slide `index` of `count`. */
export function segmentFills(index: number, count: number, max = MAX_SEGMENTS): number[] {
  if (count <= 0) return [];
  const segments = Math.min(count, max);
  const progress = ((index + 1) / count) * segments;
  return Array.from({ length: segments }, (_, i) => Math.max(0, Math.min(1, progress - i)));
}
