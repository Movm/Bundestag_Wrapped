/**
 * Date range on `datum` (datetime index). Day-only bounds are widened to the
 * whole day, so `to: 2026-06-30` includes that day.
 * @param {string|undefined} from - YYYY-MM-DD or RFC 3339
 * @param {string|undefined} to - YYYY-MM-DD or RFC 3339
 */
export function buildDateCondition(from, to) {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const range = {};
  if (from) range.gte = day.test(from) ? `${from}T00:00:00Z` : from;
  if (to) range.lte = day.test(to) ? `${to}T23:59:59Z` : to;
  return { key: 'datum', range };
}
