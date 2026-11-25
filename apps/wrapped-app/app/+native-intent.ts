import { isPreviewCodeLink } from '../src/native/previewCodeLink';

// The preview-code link is not a screen: index.tsx reads the code from the URL, so the
// router keeps the single home route instead of failing on an unknown "zugang" route.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return isPreviewCodeLink(path) ? '/' : path;
}
