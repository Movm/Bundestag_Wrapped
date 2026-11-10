/**
 * Edition JSON requests the cover boot script started during HTML parsing
 * (src/cover/boot.ts), keyed by URL. Each response is handed out once, so the
 * loader still owns parsing, validation and error handling.
 */
declare global {
  interface Window { __btPrefetch?: Map<string, Promise<Response>> }
}

export function takePrefetched(url: string): Promise<Response> | null {
  const pending = window.__btPrefetch?.get(url);
  if (!pending) return null;
  window.__btPrefetch!.delete(url);
  return pending;
}
