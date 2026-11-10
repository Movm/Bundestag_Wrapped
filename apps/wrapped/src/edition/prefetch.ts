/**
 * Edition JSON requests the cover boot script started during HTML parsing
 * (src/cover/boot.ts), keyed by URL. Each response is handed out once, so the
 * loader still owns parsing, validation and error handling. Uses globalThis:
 * the loader also runs in the search worker, which has no window.
 */
declare global {
  var __btPrefetch: Map<string, Promise<Response>> | undefined;
}

export function takePrefetched(url: string): Promise<Response> | null {
  const cache = globalThis.__btPrefetch;
  const pending = cache?.get(url);
  if (!cache || !pending) return null;
  cache.delete(url);
  return pending;
}
