/**
 * Theme Music Manager for Bundestag Wrapped (Web)
 *
 * Background music per story section, crossfaded between two fixed <audio>
 * elements ("decks"). Which track plays where is set per edition in
 * config/<edition>/music.json (see @/shared/theme-music).
 *
 * Why two fixed decks instead of one element per track: Safari grants audio
 * playback per media element, and only to an element first played inside a
 * user activation. A fresh element per track meant every section change was
 * a new element that might be refused. The two decks are unlocked once, on
 * the reader's first press (`audio-unlock.ts`), and then swap tracks freely.
 *
 * Reliability rules:
 * - `wanted` is the track that should play, `playing` the one that is
 *   confirmed playing. Only a resolved `play()` sets `playing`, so a refused
 *   start is never mistaken for a running one.
 * - A refused start is retried inside the reader's next press.
 * - "Starten" calls `startPrimed()` synchronously in its click, so the first
 *   track starts with the button, not at some later idle moment.
 * - The idle deck preloads the next section's track, so a change only fades.
 */

import { useEffect, useRef } from 'react';
import type { SlideType } from '@/components/main-wrapped/constants';
import { useAudioStore } from '@/stores/audioStore';
import { onUserActivation } from './audio-unlock';
import { whenTrulyIdle } from './when-idle';
import {
  type ThemeType,
  THEME_PATHS,
  THEME_VOLUME,
  CROSSFADE_DURATION,
  themeForSlide,
} from '@/shared/theme-music';

// Re-export shared types and constants for backwards compatibility
export { type ThemeType, THEME_TRACK_INFO } from '@/shared/theme-music';

const FADE_STEPS = 20;

/**
 * The track for a slide; `editionId` selects that edition's music.json.
 */
export function getThemeForSlide(slideId: SlideType, editionId?: string | null): ThemeType {
  return themeForSlide(slideId, editionId);
}

/** 0.1 s of silence, used to unlock a deck that has no track yet. */
function silentWav(): string {
  const samples = 800;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + samples, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  text(36, 'data'); view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

interface Deck {
  audio: HTMLAudioElement;
  theme: ThemeType | null;
  fade: number | null;
  /** Set while this deck is meant to be audible; the unlock must not pause it. */
  claimed: boolean;
}

export class ThemeMusicManager {
  private decks: [Deck, Deck] | null = null;
  /** Index of the deck that carries `playing`. */
  private active = 0;
  private wanted: ThemeType | null = null;
  private playing: ThemeType | null = null;
  private primed: ThemeType | null = null;
  private pendingPreload: ThemeType | null = null;
  private stopRetry: (() => void) | null = null;

  private getDecks(): [Deck, Deck] | null {
    if (typeof window === 'undefined') return null;
    if (this.decks) return this.decks;
    const make = (): Deck => {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      return { audio, theme: null, fade: null, claimed: false };
    };
    this.decks = [make(), make()];
    const stop = onUserActivation(() => {
      stop();
      this.unlockDecks();
    });
    return this.decks;
  }

  /** Plays each idle deck muted for a moment inside the press, so Safari allows it later. */
  private unlockDecks() {
    const silent = silentWav();
    for (const deck of this.decks ?? []) {
      if (deck.claimed) continue;
      const audio = deck.audio;
      const borrowed = !audio.getAttribute('src');
      if (borrowed) audio.src = silent;
      audio.muted = true;
      audio.play().then(() => {
        if (!deck.claimed) audio.pause();
      }).catch(() => {}).finally(() => {
        audio.muted = false;
        if (borrowed && deck.theme === null) audio.removeAttribute('src');
      });
    }
  }

  private load(deck: Deck, theme: ThemeType) {
    if (deck.theme === theme) return;
    deck.theme = theme;
    deck.audio.src = THEME_PATHS[theme];
    deck.audio.load();
  }

  private fade(deck: Deck, to: number, done?: () => void) {
    if (deck.fade !== null) clearInterval(deck.fade);
    const from = deck.audio.volume;
    let step = 0;
    deck.fade = window.setInterval(() => {
      step++;
      deck.audio.volume = Math.min(1, Math.max(0, from + (to - from) * (step / FADE_STEPS)));
      if (step < FADE_STEPS) return;
      if (deck.fade !== null) clearInterval(deck.fade);
      deck.fade = null;
      done?.();
    }, CROSSFADE_DURATION / FADE_STEPS);
  }

  private silence(deck: Deck) {
    deck.claimed = false;
    this.fade(deck, 0, () => {
      deck.audio.pause();
      if (this.pendingPreload) {
        const theme = this.pendingPreload;
        this.pendingPreload = null;
        this.preload(theme);
      }
    });
  }

  /** Retry the wanted track inside the reader's next press. */
  private retryOnActivation() {
    if (this.stopRetry) return;
    this.stopRetry = onUserActivation(() => {
      this.stopRetry?.();
      this.stopRetry = null;
      if (this.wanted && this.wanted !== this.playing) this.playTheme(this.wanted);
    });
  }

  /** Load a theme into the idle deck ahead of time (no playback). */
  preload(theme: ThemeType): void {
    if (useAudioStore.getState().isMuted) return; // no download for people who muted
    const decks = this.getDecks();
    if (!decks || decks.some(deck => deck.theme === theme)) return;
    const idle = decks[1 - this.active];
    // Still starting or fading out a track: load once it is silent.
    if (idle.claimed || idle.fade !== null) {
      this.pendingPreload = theme;
      return;
    }
    this.load(idle, theme);
  }

  /**
   * Remember the first track at once (so an early "Starten" can start it) and
   * preload it when the page is idle, so pressing play only has to play.
   */
  prime(theme: ThemeType): () => void {
    this.primed = theme;
    return whenTrulyIdle(() => this.preload(theme));
  }

  /** Call synchronously inside the "Starten" click: starts the primed track with the button. */
  startPrimed(): void {
    if (this.primed) this.playTheme(this.primed);
  }

  /** Make `theme` the track that plays, crossfading from the current one. */
  playTheme(theme: ThemeType): void {
    const decks = this.getDecks();
    if (!decks) return;
    this.wanted = theme;
    if (useAudioStore.getState().isMuted) return; // resume() picks `wanted` up on unmute
    const current = decks[this.active];
    if (theme === this.playing && !current.audio.paused) return;

    // Same track, only paused: continue on its deck. Otherwise the idle deck takes it.
    const index = theme === this.playing ? this.active : 1 - this.active;
    const deck = decks[index];
    const previous = index === this.active ? null : current;
    if (deck.fade !== null) { clearInterval(deck.fade); deck.fade = null; }
    if (index !== this.active) {
      this.load(deck, theme);
      deck.audio.volume = 0;
      deck.audio.currentTime = 0;
    }
    deck.claimed = true;

    deck.audio.play().then(() => {
      // Superseded while starting (fast scrolling): this deck is no longer wanted.
      if (this.wanted !== theme || deck.theme !== theme) {
        if (deck.theme !== this.wanted) { deck.claimed = false; deck.audio.pause(); }
        return;
      }
      this.stopRetry?.();
      this.stopRetry = null;
      this.active = index;
      this.playing = theme;
      this.fade(deck, THEME_VOLUME);
      if (previous && !previous.audio.paused) this.silence(previous);
      useAudioStore.getState().setCurrentTheme(theme);
      if (this.pendingPreload) {
        const next = this.pendingPreload;
        this.pendingPreload = null;
        this.preload(next);
      }
    }).catch((error: unknown) => {
      // AbortError: the source was swapped for a newer track; that call takes over.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      deck.claimed = false;
      if (this.wanted === theme) this.retryOnActivation();
      console.debug('Theme music failed to start:', error instanceof Error ? error.message : error);
    });
  }

  /** Pause the current theme (keeps its position). */
  pause(): void {
    const deck = this.decks?.[this.active];
    if (deck && this.playing) deck.audio.pause();
  }

  /** Resume after unmuting: continues the playing track or starts the wanted one. */
  resume(): void {
    if (useAudioStore.getState().isMuted || !this.wanted) return;
    this.playTheme(this.wanted);
  }

  /** Stop all music (finale, leaving the story). */
  stop(): void {
    for (const deck of this.decks ?? []) {
      if (deck.fade !== null) clearInterval(deck.fade);
      deck.fade = null;
      deck.claimed = false;
      deck.audio.pause();
      deck.audio.volume = 0;
    }
    this.stopRetry?.();
    this.stopRetry = null;
    this.wanted = null;
    this.playing = null;
    useAudioStore.getState().setCurrentTheme(null);
  }

  getCurrentTheme(): ThemeType | null {
    return this.playing;
  }

  isPlaying(): boolean {
    return Boolean(this.playing && this.decks && !this.decks[this.active].audio.paused);
  }

  /**
   * Release the tracks when leaving the story. The decks themselves stay:
   * they are already unlocked, which a new element would not be.
   */
  cleanup(): void {
    this.stop();
    this.primed = null;
    this.pendingPreload = null;
    for (const deck of this.decks ?? []) {
      deck.theme = null;
      deck.audio.removeAttribute('src');
      deck.audio.load();
    }
  }
}

// Export singleton instance
export const themeMusic = new ThemeMusicManager();

/**
 * React hook for using theme music with slide changes
 * Properly uses useEffect to trigger music only on actual slide transitions
 */
export function useThemeMusic(currentSlide: SlideType | null): void {
  const prevSlideRef = useRef<SlideType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentSlide) return;

    // Only play if slide actually changed (prevents unnecessary calls)
    if (prevSlideRef.current === currentSlide) return;
    prevSlideRef.current = currentSlide;

    const theme = getThemeForSlide(currentSlide);
    themeMusic.playTheme(theme);
  }, [currentSlide]);
}
