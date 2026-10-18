import { beforeEach, describe, expect, it } from 'vitest';
import { IS_DEV_AUDIO_DISABLED, useAudioStore } from './audioStore';

describe('audioStore in development', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAudioStore.getState().setMuted(true);
  });

  it('keeps audio muted even when callers try to enable it', () => {
    expect(IS_DEV_AUDIO_DISABLED).toBe(true);

    useAudioStore.getState().setMuted(false);
    expect(useAudioStore.getState().isMuted).toBe(true);

    expect(useAudioStore.getState().toggleMute()).toBe(true);
    expect(useAudioStore.getState().isMuted).toBe(true);
    expect(window.localStorage.getItem('bundestag-wrapped-sound-muted')).toBe('true');
  });
});
