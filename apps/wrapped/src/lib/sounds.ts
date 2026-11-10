/**
 * Sound System for Bundestag Wrapped (Web)
 *
 * Short effects (click, quiz answers, slide whoosh, Perfect Match drag and
 * swipe feedback) run through one Web Audio context: each sound is decoded
 * once, starts without the latency of a media element and can overlap itself,
 * which drag ticks need. Background music stays a looping <audio> element,
 * since it is long and streams.
 *
 * - The UI sounds are one SND sprite (`snd-sprite.ts`), imported lazily so it
 *   never weighs on the start bundle; `start` is a file in /public/sounds.
 * - Sounds with several variants (tap, swipe) pick one at random, so repeated
 *   ticks don't sound mechanical.
 * - Loading starts when the page is idle; the context is resumed on the first
 *   pointer or key press, as browsers require.
 * - A sound asked for while it is still decoding plays as soon as it is ready,
 *   if that is within its wait limit; later than that it would no longer
 *   match the action, so it is dropped. Before the reader has pressed
 *   anything, browsers forbid sound, so nothing is queued at all.
 * - Mute preference lives in the audio store (persisted to localStorage).
 */

import {
  type SoundType,
  SOUND_FILES,
  SOUND_SPRITES,
  SOUND_VOLUMES,
  createSlideTransitionSoundHook,
} from '@/shared/sounds';
import { hasUserActivation, onUserActivation } from './audio-unlock';
import { whenTrulyIdle } from './when-idle';
import { IS_DEV_AUDIO_DISABLED, useAudioStore } from '@/stores/audioStore';

export type { SoundType };

const BACKGROUND_MUSIC_PATH = '/sounds/background.mp3';
const BACKGROUND_VOLUME = 0.08;

// Background music instance
let backgroundMusic: HTMLAudioElement | null = null;
let isMusicPlaying = false;

interface Clip {
  buffer: AudioBuffer;
  offset: number;
  duration: number;
}

let context: AudioContext | null = null;
const clips = new Map<SoundType, Clip[]>();
let loading: Promise<void> | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

async function decodeFirst(ctx: AudioContext, urls: string[]): Promise<AudioBuffer | null> {
  for (const url of urls) {
    try {
      return await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
    } catch (error) {
      console.debug(`Sound ${url} failed to load:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

const nextTask = () => new Promise(resolve => window.setTimeout(resolve, 0));

/**
 * Decode the intro sound and the SND sprite once, one per task so decoding
 * never costs a frame. Safe to call repeatedly; later calls share the promise.
 */
export function initSounds(): Promise<void> {
  if (IS_DEV_AUDIO_DISABLED || typeof window === 'undefined') return Promise.resolve();
  if (loading) return loading;
  const ctx = audioContext();
  if (!ctx) return Promise.resolve();
  loading = (async () => {
    // The intro sound first: it is the one played on the very first tap.
    for (const [type, url] of Object.entries(SOUND_FILES) as [SoundType, string][]) {
      const buffer = await decodeFirst(ctx, [url]);
      if (buffer) clips.set(type, [{ buffer, offset: 0, duration: buffer.duration }]);
      flushPending();
      await nextTask();
    }
    const { SPRITE_URLS, SPRITE_MAP } = await import('./snd-sprite');
    const buffer = await decodeFirst(ctx, SPRITE_URLS);
    if (!buffer) return;
    for (const [type, names] of Object.entries(SOUND_SPRITES) as [SoundType, readonly string[]][]) {
      const parts = names.map(name => SPRITE_MAP[name]).filter(Boolean);
      clips.set(type, parts.map(({ start, end }) => ({ buffer, offset: start, duration: end - start })));
    }
    flushPending();
  })();
  return loading;
}

if (typeof window !== 'undefined' && !IS_DEV_AUDIO_DISABLED) {
  // Activations allow resume(); stop listening once the context runs.
  const stop = onUserActivation(() => {
    void initSounds();
    const ctx = audioContext();
    if (!ctx) return;
    void ctx.resume().then(() => { if (ctx.state === 'running') stop(); });
  });

  // Loading and decoding needs no user gesture (only starting the context does).
  whenTrulyIdle(() => void initSounds());
}

/** How long a sound may wait for its decode before it no longer fits the action. */
const MAX_WAIT_MS: Partial<Record<SoundType, number>> = { start: 1500 };
const DEFAULT_MAX_WAIT_MS = 200;
const pending = new Map<SoundType, number>();

function flushPending() {
  const now = performance.now();
  for (const [type, deadline] of pending) {
    if (!clips.has(type)) continue;
    pending.delete(type);
    if (now <= deadline) playSound(type);
  }
}

/**
 * Play a sound effect. Fire-and-forget: muted, not yet decoded or a
 * suspended context all simply skip the sound.
 */
export function playSound(type: SoundType): void {
  if (IS_DEV_AUDIO_DISABLED) return;
  if (useAudioStore.getState().isMuted) return;
  if (typeof window === 'undefined') return;

  // Before any press the context can't start; a queued sound would go off on the first click.
  if (!hasUserActivation()) return;

  const variants = clips.get(type);
  const ctx = context;
  if (!variants?.length || !ctx) {
    pending.set(type, performance.now() + (MAX_WAIT_MS[type] ?? DEFAULT_MAX_WAIT_MS));
    void initSounds();
    return;
  }
  if (ctx.state !== 'running') void ctx.resume();

  const clip = variants[Math.floor(Math.random() * variants.length)];
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = clip.buffer;
  gain.gain.value = SOUND_VOLUMES[type];
  source.connect(gain).connect(ctx.destination);
  source.start(0, clip.offset, clip.duration);
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
