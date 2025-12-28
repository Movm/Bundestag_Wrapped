/**
 * Debug Utilities for React Re-render Analysis
 *
 * Enable debugging by setting in browser console:
 *   localStorage.setItem('DEBUG_RENDERS', 'true')
 *
 * Disable with:
 *   localStorage.removeItem('DEBUG_RENDERS')
 */

const DEBUG_ENABLED = () =>
  typeof window !== 'undefined' &&
  localStorage.getItem('DEBUG_RENDERS') === 'true';

const renderCounts = new Map<string, number>();

/**
 * Log component render with render count
 */
export function logRender(
  componentName: string,
  props?: Record<string, unknown>
) {
  if (!DEBUG_ENABLED()) return;

  const count = (renderCounts.get(componentName) ?? 0) + 1;
  renderCounts.set(componentName, count);

  console.log(
    `%c[Render #${count}] ${componentName}`,
    'color: #4ade80; font-weight: bold',
    props ? { props } : ''
  );
}

/**
 * Performance timing for expensive operations
 * Only logs if operation takes > 5ms
 */
export function timeOperation(label: string): () => void {
  if (!DEBUG_ENABLED()) return () => {};

  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 5) {
      console.log(
        `%c[Perf] ${label}: ${duration.toFixed(2)}ms`,
        duration > 16 ? 'color: #ef4444' : 'color: #a3a3a3'
      );
    }
  };
}

/**
 * Reset all debug state (useful when navigating)
 */
export function resetDebugState() {
  renderCounts.clear();
}
