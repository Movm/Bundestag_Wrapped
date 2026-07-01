import { useRef, useEffect } from 'react';

const DEBUG = () =>
  typeof window !== 'undefined' &&
  localStorage.getItem('DEBUG_RENDERS') === 'true';

/**
 * Hook that tracks why a component re-rendered.
 *
 * Enable: localStorage.setItem('DEBUG_RENDERS', 'true')
 * Disable: localStorage.removeItem('DEBUG_RENDERS')
 *
 * Output:
 *   [Render #5] ComponentName - 2 change(s)
 *     propA: (same value, different reference)
 *     propB: { from: 'old', to: 'new' }
 */
export function useDebugRender<T extends Record<string, unknown>>(
  componentName: string,
  values: T
) {
  const prevValuesRef = useRef<T | null>(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (!DEBUG()) return;

    renderCountRef.current += 1;
    const renderNum = renderCountRef.current;

    if (prevValuesRef.current) {
      const changes: Array<{
        key: string;
        from: unknown;
        to: unknown;
        isRefChange: boolean;
      }> = [];

      for (const key of Object.keys(values)) {
        const prev = prevValuesRef.current[key];
        const curr = values[key];
        if (!Object.is(prev, curr)) {
          const isRefChange =
            typeof prev === 'object' &&
            prev !== null &&
            typeof curr === 'object' &&
            curr !== null &&
            JSON.stringify(prev) === JSON.stringify(curr);
          changes.push({ key, from: prev, to: curr, isRefChange });
        }
      }

      if (changes.length > 0) {
        console.group(
          `%c[Render #${renderNum}] ${componentName} - ${changes.length} change(s)`,
          'color: #f97316; font-weight: bold'
        );
        changes.forEach(({ key, from, to, isRefChange }) => {
          if (isRefChange) {
            console.log(`  %c${key}: (same value, different reference)`, 'color: #fbbf24');
          } else {
            console.log(`  ${key}:`, { from, to });
          }
        });
        console.groupEnd();
      } else {
        console.log(
          `%c[Render #${renderNum}] ${componentName} - parent re-render (no prop changes)`,
          'color: #6b7280'
        );
      }
    } else {
      console.log(
        `%c[Render #${renderNum}] ${componentName} - initial render`,
        'color: #4ade80'
      );
    }

    prevValuesRef.current = { ...values };
  });
}
