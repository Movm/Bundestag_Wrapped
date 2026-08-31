/**
 * LocalStorage persistence for Wrapped page progress.
 * Persists quiz answers and current section with 7-day TTL.
 */

import { editionStorageKey, LEGACY_SURFACE, type EditionSurface } from '@/edition/surface';

const STORAGE_KEY = 'bundestag-wrapped-progress';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface WrappedProgress {
  quizAnswers: Record<string, boolean>;
  currentSection: string;
  savedAt: number;
}

type StorageSurface = Pick<EditionSurface, 'editionId' | 'dataVersion'>;

function keyFor(surface?: StorageSurface): string {
  return editionStorageKey(STORAGE_KEY, surface ?? LEGACY_SURFACE);
}

function readProgress(key: string): WrappedProgress | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as WrappedProgress;
}

/**
 * Get saved progress from localStorage, returning null if expired or invalid.
 */
export function getWrappedProgress(surface?: StorageSurface): WrappedProgress | null {
  try {
    const key = keyFor(surface);
    let data = readProgress(key);

    // One-time, idempotent migration from the unversioned legacy key.
    if (!data && surface && surface.editionId === 'legacy') {
      data = readProgress(STORAGE_KEY);
      if (data) {
        window.localStorage.setItem(key, JSON.stringify(data));
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    if (!data) return null;

    // Check expiration
    if (Date.now() - data.savedAt > TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    // Invalid JSON or other error - clear corrupted data
    window.localStorage.removeItem(keyFor(surface));
    return null;
  }
}

/**
 * Save progress to localStorage with current timestamp.
 */
export function setWrappedProgress(
  progress: Omit<WrappedProgress, 'savedAt'>,
  surface?: StorageSurface,
): void {
  try {
    const data: WrappedProgress = {
      ...progress,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(keyFor(surface), JSON.stringify(data));
  } catch {
    // Storage full or disabled - fail silently
  }
}

/**
 * Clear saved progress (e.g., when user completes the experience).
 */
export function clearWrappedProgress(surface?: StorageSurface): void {
  try {
    window.localStorage.removeItem(keyFor(surface));
  } catch {
    // Fail silently
  }
}
