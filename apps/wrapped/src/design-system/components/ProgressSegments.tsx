const MAX_SEGMENTS = 10;

/** Fill (0…1) of each segment for slide `index` of `count`. */
export function segmentFills(index: number, count: number, max = MAX_SEGMENTS): number[] {
  if (count <= 0) return [];
  const segments = Math.min(count, max);
  const progress = ((index + 1) / count) * segments;
  return Array.from({ length: segments }, (_, i) => Math.max(0, Math.min(1, progress - i)));
}

/**
 * Story progress in segments (≤ 10, so 48 slides stay legible). Decorative:
 * the shell's live region already announces "Folie X von Y". Fill moves with
 * transform: scaleX — no layout work per slide change.
 */
export function ProgressSegments({ index, count, surface }: { index: number; count: number; surface: string }) {
  return (
    <div className="ds-progress" data-surface={surface} aria-hidden="true">
      {segmentFills(index, count).map((fill, i) => (
        <span key={i} className="ds-progress__segment">
          <span className="ds-progress__fill" style={{ transform: `scaleX(${fill})` }} />
        </span>
      ))}
    </div>
  );
}
