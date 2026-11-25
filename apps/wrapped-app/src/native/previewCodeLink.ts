import { type NativeToWeb } from '../../../wrapped/src/shared/native-bridge/protocol';

// `bundestag-wrapped://zugang?code=XYZ` (the scheme is in app.json); Expo Router hands the
// path on without the scheme, so `/zugang?code=XYZ` counts as well.
const ZUGANG = /^(?:bundestag-wrapped:\/\/)?\/*zugang\/?(?:\?([^#]*))?(?:#.*)?$/i;

/** Is this URL the preview-code deep link, with or without a code? */
export function isPreviewCodeLink(url: string): boolean {
  return ZUGANG.test(url);
}

/**
 * The preview code carried by a deep link, normalised like /zugang/ and the server do
 * (lowercase, [a-z0-9_-] only), or null for any other URL or an empty code.
 */
export function previewCodeFromUrl(url: string | null | undefined): string | null {
  const match = url ? ZUGANG.exec(url) : null;
  const raw = match?.[1]?.match(/(?:^|&)code=([^&]*)/)?.[1];
  if (raw === undefined) return null;
  let decoded = raw;
  try { decoded = decodeURIComponent(raw.replace(/\+/g, ' ')); } catch { /* keep the raw text */ }
  const code = decoded.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return code || null;
}

/** The bridge message for a deep link, or null when the URL carries no code. */
export function previewCodeMessage(url: string | null | undefined): Extract<NativeToWeb, { type: 'preview.code' }> | null {
  const code = previewCodeFromUrl(url);
  return code ? { type: 'preview.code', code } : null;
}
