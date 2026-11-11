import type { CoverController, createCover } from './cover';

/** Story routes that open on the cover: "/" and "/<edition year>". */
export const COVER_ROUTE = /^\/(\d{4})?\/?$/;
export const EAGLE_SRC = '/cover-adler.webp';

/** What the inline boot script leaves behind for React (src/cover/boot.ts). */
export interface CoverShell {
  controller: CoverController;
  host: HTMLElement;
  /** "Los geht’s" was pressed before React was ready; the wipe already ran. */
  startRequested: boolean;
}

declare global {
  interface Window {
    __btCover?: CoverShell;
    /** The cover factory, defined once by the inline boot script on every page. */
    __btCreateCover?: typeof createCover;
  }
}

let instance: CoverController | null = null;

/**
 * The one cover of the page. Adopts the element the boot script painted at
 * first load (its animations keep running across the DOM move), otherwise
 * creates it. `startRequested` tells the caller to continue at once.
 */
export function acquireCover(): { controller: CoverController; startRequested: boolean } {
  const shell = window.__btCover;
  if (shell) {
    window.__btCover = undefined;
    instance = shell.controller;
    return { controller: instance, startRequested: shell.startRequested };
  }
  if (!instance) {
    const create = window.__btCreateCover;
    if (!create) throw new Error('Cover boot script missing from index.html');
    instance = create(document.createElement('div'), { eagleSrc: EAGLE_SRC, year: null });
  }
  return { controller: instance, startRequested: false };
}

/** Removes the boot overlay once its cover has moved into the story. */
export function releaseBootShell(host: HTMLElement | null) {
  host?.remove();
  document.documentElement.classList.remove('cover-boot');
}

/** Error screens on a story route: drop the boot cover so the message is visible. */
export function dismissBootCover() {
  const shell = window.__btCover;
  window.__btCover = undefined;
  releaseBootShell(shell?.host ?? null);
}
