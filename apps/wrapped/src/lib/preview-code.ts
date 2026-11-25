import { assetUrl, isEmbedded } from '@/lib/site';

/**
 * The code for the unpublished edition ("Gartenzaun"). In the browser it travels
 * as a cookie set by /zugang/. The app WebView sends no cookies cross-origin, so
 * there it is kept in localStorage and sent as an `X-Gartenzaun` request header
 * on the gated data paths. A garden fence, not a vault.
 */
const STORAGE_KEY = 'gartenzaun';
const GATED_PREFIX = '/data/2026/';

/** Same normalisation as /zugang/ and the entrypoint: lowercase, [a-z0-9_-] only. */
export function normalizePreviewCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export function getPreviewCode(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

/** Stores the normalised code; false when it is empty or storage is unavailable. */
export function setPreviewCode(value: string): boolean {
  const code = normalizePreviewCode(value);
  if (!code) return false;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, code);
    return getPreviewCode() === code;
  } catch {
    return false;
  }
}

/** Only the gated paths carry the code, and only inside the app. */
export function previewHeaders(path: string): Record<string, string> {
  if (!isEmbedded() || !path.startsWith(GATED_PREFIX)) return {};
  const code = getPreviewCode();
  return code ? { 'X-Gartenzaun': code } : {};
}

export type PreviewCodeCheck = 'ok' | 'wrong' | 'unreachable';

/** Asks the server whether `code` opens the gate, using a gated data path. Stores nothing. */
export async function checkPreviewCode(path: string, value: string): Promise<PreviewCodeCheck> {
  const code = normalizePreviewCode(value);
  if (!code) return 'wrong';
  try {
    const response = await fetch(assetUrl(path), { headers: { 'X-Gartenzaun': code }, redirect: 'error' });
    await response.body?.cancel();
    if (response.status === 401) return 'wrong';
    return response.ok ? 'ok' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}
