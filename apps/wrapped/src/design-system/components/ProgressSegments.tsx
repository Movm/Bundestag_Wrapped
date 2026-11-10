import { segmentFills } from '../progress';

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
