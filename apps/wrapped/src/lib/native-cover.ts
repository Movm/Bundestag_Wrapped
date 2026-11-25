import { isNativeShell, postToNative } from '@/lib/native-shell';

export interface CoverReport { visible: boolean; year: number | null; muted: boolean }

let last: CoverReport | null = null;

/** Tells the native shell whether its cover is showing. No-op in the browser; repeats are not sent again. */
export function reportCover(state: CoverReport): void {
  if (!isNativeShell()) return;
  if (last && last.visible === state.visible && last.year === state.year && last.muted === state.muted) return;
  last = { ...state };
  postToNative({ type: 'cover', ...state });
}

/** The mute flag of the last report: lets the boot shell report without pulling the audio store into the boot bundle. */
export function lastReportedMuted(): boolean {
  return last?.muted ?? false;
}

/** Tests only. */
export function _resetNativeCoverForTesting(): void {
  last = null;
}
