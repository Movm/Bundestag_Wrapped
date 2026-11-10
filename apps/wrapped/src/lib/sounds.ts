/**
 * Sound System for Bundestag Wrapped (Web)
 *
 * Short effects (click, quiz answers, slide whoosh, Perfect Match drag and
 * swipe feedback) run through one Web Audio context: every sound is decoded
 * once into a buffer, starts without the latency of a media element and can
 * overlap itself, which drag ticks need. Background music stays a looping
 * <audio> element, since it is long and streams.
 *
 * - The UI sounds are data URIs in `ui-sounds.ts`, imported lazily so they
 *   never weigh on the start bundle; `start` is a file in /public/sounds.
 * - Loading starts when the page is idle; the context is resumed on the first
 *   pointer or key press, as browsers require.
 * - A sound asked for before its buffer is ready is skipped, not played late.
 * - Mute preference lives in the audio store (persisted to localStorage).
 */

import {
  type SoundType,
  SOUND_FILES,
  SOUND_VOLUMES,
  createSlideTransitionSoundHook,
} from '@/shared/sounds';
import { whenTrulyIdle } from './when-idle';
import { IS_DEV_AUDIO_DISABLED, useAudioStore } from '@/stores/audioStore';

export type { SoundType };

const BACKGROUND_MUSIC_PATH = '/sounds/background.mp3';
const BACKGROUND_VOLUME = 0.08;

// Background music instance
let backgroundMusic: HTMLAudioElement | null = null;
let isMusicPlaying = false;

let context: AudioContext | null = null;
const buffers = new Map<SoundType, AudioBuffer>();
let loading: Promise<void> | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

/** Data URIs are decoded in place, so a future CSP `connect-src` can't block them. */
async function bytes(src: string): Promise<ArrayBuffer> {
  if (!src.startsWith('data:')) return (await fetch(src)).arrayBuffer();
  const binary = atob(src.slice(src.indexOf(',') + 1));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

async function decode(ctx: AudioContext, type: SoundType, src: string): Promise<void> {
  try {
    buffers.set(type, await ctx.decodeAudioData(await bytes(src)));
  } catch (error) {
    console.debug(`Sound "${type}" failed to load:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Decode every sound once, one per task so decoding never costs a frame.
 * Safe to call repeatedly; later calls return the same promise.
 */
export function initSounds(): Promise<void> {
  if (IS_DEV_AUDIO_DISABLED || typeof window === 'undefined') return Promise.resolve();
  if (loading) return loading;
  const ctx = audioContext();
  if (!ctx) return Promise.resolve();
  loading = import('./ui-sounds').then(async ({ UI_SOUNDS }) => {
    // The intro sound first: it is the one played on the very first tap.
    const sources = { ...SOUND_FILES, ...UI_SOUNDS } as Partial<Record<SoundType, string>>;
    for (const [type, src] of Object.entries(sources) as [SoundType, string][]) {
      await decode(ctx, type, src);
      await new Promise(resolve => window.setTimeout(resolve, 0));
    }
  });
  return loading;
}

if (typeof window !== 'undefined' && !IS_DEV_AUDIO_DISABLED) {
  // pointerdown/up and keydown are user activations, so resume() is allowed here.
  const events = ['pointerdown', 'pointerup', 'keydown'] as const;
  const unlock = () => {
    void initSounds();
    const ctx = audioContext();
    if (!ctx) return;
    void ctx.resume().then(() => {
      if (ctx.state === 'running') events.forEach(event => document.removeEventListener(event, unlock, true));
    });
  };
  events.forEach(event => document.addEventListener(event, unlock, true));

  // Loading and decoding needs no user gesture (only starting the context does).
  whenTrulyIdle(() => void initSounds());
}

/**
 * Play a sound effect. Fire-and-forget: muted, not yet decoded or a
 * suspended context all simply skip the sound.
 */
export function playSound(type: SoundType): void {
  if (IS_DEV_AUDIO_DISABLED) return;
  if (useAudioStore.getState().isMuted) return;
  if (typeof window === 'undefined') return;

  const buffer = buffers.get(type);
  const ctx = context;
  if (!buffer || !ctx) {
    void initSounds();
    return;
  }
  if (ctx.state !== 'running') void ctx.resume();

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = SOUND_VOLUMES[type];
  source.connect(gain).connect(ctx.destination);
  source.start();
}

/**
 * Initialize background music (lazy, called on first play)
 */
function initBackgroundMusic(): HTMLAudioElement {
  if (!backgroundMusic) {
    backgroundMusic = new Audio(BACKGROUND_MUSIC_PATH);
    backgroundMusic.loop = true;
    backgroundMusic.volume = BACKGROUND_VOLUME;
    backgroundMusic.preload = 'auto';
  }
  return backgroundMusic;
}

/**
 * Start playing background music
 */
export function playBackgroundMusic(): void {
  if (IS_DEV_AUDIO_DISABLED) return;
  if (useAudioStore.getState().isMuted) return;
  if (typeof window === 'undefined') return;

  const music = initBackgroundMusic();
  const playPromise = music.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isMusicPlaying = true;
      })
      .catch((error) => {
        console.debug('Background music failed:', error.message);
      });
  }
}

/**
 * Pause background music
 */
export function pauseBackgroundMusic(): void {
  if (backgroundMusic) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
}

/**
 * Toggle background music on/off
 */
export function toggleBackgroundMusic(): boolean {
  if (IS_DEV_AUDIO_DISABLED) return false;
  if (isMusicPlaying) {
    pauseBackgroundMusic();
    return false;
  } else {
    playBackgroundMusic();
    return true;
  }
}

/**
 * Check if background music is currently playing
 */
export function isBackgroundMusicPlaying(): boolean {
  return isMusicPlaying;
}

/**
 * Hook for playing whoosh sound on slide transitions
 */
export const useSlideTransitionSound = createSlideTransitionSoundHook(playSound);
