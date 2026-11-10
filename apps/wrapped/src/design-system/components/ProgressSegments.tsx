import { segmentFills } from '../progress';

/**
 * Story progress in segments (≤ 10, so 48 slides stay legible), exposed as a
 * progressbar named "Folie X von Y". The shell's polite live region announces
 * changes; this element answers "where am I?" on demand. Fill moves with
 * transform: scaleX — no layout work per slide change.
 */
export function ProgressSegments({ index, count, surface }: { index: number; count: number; surface: string }) {
  const label = `Folie ${index + 1} von ${count}`;
  return (
    <div
      className="ds-progress"
      data-surface={surface}
      role="progressbar"
      aria-label="Fortschritt"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={index + 1}
      aria-valuetext={label}
      title={label}
    >
      {segmentFills(index, count).map((fill, i) => (
        <span key={i} className="ds-progress__segment" aria-hidden="true">
          <span className="ds-progress__fill" style={{ transform: `scaleX(${fill})` }} />
        </span>
      ))}
    </div>
  );
}
