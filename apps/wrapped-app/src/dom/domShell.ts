import { type ShareFile, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { SITE_ORIGIN } from '../../../wrapped/src/lib/site';

type Post = (message: WebToNative) => void;

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

function abortError(): Error {
  const error = new Error('Share canceled');
  error.name = 'AbortError';
  return error;
}

/**
 * The WebView has no Web Share API. `navigator.share` forwards to the native share sheet
 * and settles when native answers with `share.result` (`awaitResult(id)` resolves its `ok`).
 */
export function polyfillShare(post: Post, awaitResult: (id: number) => Promise<boolean>): void {
  let nextId = 1;
  const hasContent = (data?: ShareData) => Boolean(data && (data.title || data.text || data.url || data.files?.length));
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: (data?: ShareData) => hasContent(data) });
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: async (data?: ShareData): Promise<void> => {
      if (!hasContent(data)) throw new TypeError('Nothing to share');
      const id = nextId++;
      const files: ShareFile[] = await Promise.all(
        (data?.files ?? []).map(async file => ({ name: file.name, type: file.type, base64: await readBase64(file) })),
      );
      const result = awaitResult(id);
      post({ type: 'share', id, title: data?.title, text: data?.text, url: data?.url, ...(files.length ? { files } : {}) });
      if (!(await result)) throw abortError();
    },
  });
}

/** Capture-phase click handler: external links and non-app site paths open in the in-app browser. */
export function interceptLinks(post: Post, isAppRoute: (pathname: string) => boolean): () => void {
  const onClick = (event: MouseEvent) => {
    const anchor = (event.target as Element | null)?.closest?.('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href') ?? '';
    if (href === '' || href.startsWith('#')) return;
    let url: URL;
    try { url = new URL(href, location.href); } catch { return; }
    // file: pages (release build) have the opaque origin "null" for every scheme, so compare protocols first.
    const internal = url.protocol === location.protocol && (url.protocol === 'file:' || url.origin === location.origin);
    if (internal) {
      if (isAppRoute(url.pathname)) return;
      event.preventDefault();
      post({ type: 'openUrl', url: SITE_ORIGIN + url.pathname + url.search + url.hash });
      return;
    }
    // Only web links go to the in-app browser. mailto:, tel: etc. keep the WebView's default handling.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    event.preventDefault();
    post({ type: 'openUrl', url: url.href });
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}

/** Forwards uncaught errors and rejections. An error thrown while posting is dropped, never re-reported. */
export function reportCrashes(post: Post): () => void {
  let reporting = false;
  const report = (text: string) => {
    if (reporting) return;
    reporting = true;
    try { post({ type: 'log', level: 'error', text: text.slice(0, 2000) }); } catch { /* never loop */ } finally { reporting = false; }
  };
  const describe = (value: unknown) => String((value as Error | null)?.stack ?? value);
  const onError = (event: ErrorEvent) => report(event.error ? describe(event.error) : `${event.message} @ ${event.filename}:${event.lineno}`);
  const onRejection = (event: PromiseRejectionEvent) => report(`unhandledrejection: ${describe(event.reason)}`);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
