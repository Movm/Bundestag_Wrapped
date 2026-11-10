/**
 * Tiny inline marks (✓ ✕ ▲ ▼) as SVG. Text glyphs like these are missing in
 * Archivo, and the first one on a page makes the browser search the system
 * fonts during layout — a measured 43 ms frame. Always aria-hidden: the
 * meaning is carried by adjacent words.
 */
const PATHS = {
  check: 'M2 6.5 5 9.5 10.5 3',
  cross: 'M3 3l6 6M9 3 3 9',
  up: 'M6 2 10.5 10h-9z',
  down: 'M6 10 1.5 2h9z',
} as const;

export function Glyph({ name }: { name: keyof typeof PATHS }) {
  const filled = name === 'up' || name === 'down';
  return (
    <svg aria-hidden="true" width="0.8em" height="0.8em" viewBox="0 0 12 12" className="inline-block shrink-0 align-[-0.05em]">
      <path d={PATHS[name]} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
