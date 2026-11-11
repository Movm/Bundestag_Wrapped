import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioStore } from '@/stores/audioStore';
import { ThemeMusicManager } from './theme-music';

/** A media element whose play() the test resolves or refuses by hand. */
class FakeAudio {
  static all: FakeAudio[] = [];
  loop = false;
  preload = '';
  volume = 0;
  muted = false;
  currentTime = 0;
  paused = true;
  src = '';
  plays: { resolve: () => void; reject: (error: unknown) => void }[] = [];
  constructor() { FakeAudio.all.push(this); }
  getAttribute(name: string) { return name === 'src' && this.src ? this.src : null; }
  removeAttribute() { this.src = ''; }
  load() {}
  pause() { this.paused = true; }
  play() {
    return new Promise<void>((resolve, reject) => {
      this.plays.push({
        resolve: () => { this.paused = false; resolve(); },
        reject,
      });
    });
  }
}

const refused = () => new DOMException('The request is not allowed', 'NotAllowedError');
const press = () => document.dispatchEvent(new Event('pointerdown'));
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
/** The deck carrying a track (the unlock's muted play is ignored). */
const deckWith = (path: string) => FakeAudio.all.find(audio => audio.src.includes(path))!;

describe('ThemeMusicManager', () => {
  beforeEach(() => {
    FakeAudio.all = [];
    vi.stubGlobal('Audio', FakeAudio);
    useAudioStore.getState().setMuted(false);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does not count a refused start as playing and retries on the next press', async () => {
    const music = new ThemeMusicManager();
    music.playTheme('pressure');
    const deck = deckWith('pressure');
    deck.plays[0].reject(refused());
    await flush();
    expect(music.getCurrentTheme()).toBeNull();

    press();
    const retry = deck.plays.at(-1)!;
    expect(deck.plays.length).toBeGreaterThan(1);
    retry.resolve();
    await flush();
    expect(music.getCurrentTheme()).toBe('pressure');
  });

  it('starts the primed track synchronously inside the "Los geht’s" click', () => {
    const music = new ThemeMusicManager();
    music.prime('pressure');
    music.startPrimed();
    expect(deckWith('pressure').plays).toHaveLength(1);
  });

  it('lets the newest track win when an older start resolves late', async () => {
    const music = new ThemeMusicManager();
    music.playTheme('pressure');
    const first = deckWith('pressure');
    first.plays[0].resolve();
    await flush();

    music.playTheme('get-popular');
    const second = deckWith('get-popular');
    music.playTheme('pressure'); // reader scrolls straight back
    second.plays[0].resolve();
    await flush();
    expect(music.getCurrentTheme()).toBe('pressure');
    expect(second.paused).toBe(true);
  });

  it('remembers the wanted track while muted and starts it on unmute', async () => {
    const music = new ThemeMusicManager();
    useAudioStore.getState().setMuted(true);
    music.playTheme('pressure');
    expect(FakeAudio.all.every(audio => audio.plays.length === 0)).toBe(true);

    useAudioStore.getState().setMuted(false);
    music.resume();
    deckWith('pressure').plays.at(-1)!.resolve();
    await flush();
    expect(music.getCurrentTheme()).toBe('pressure');
  });
});
