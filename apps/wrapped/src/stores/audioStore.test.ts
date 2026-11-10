import { beforeEach, describe, expect, it } from 'vitest';
import { IS_DEV_AUDIO_DISABLED, useAudioStore } from './audioStore';

describe('audioStore in development', () => {
  beforeEach(() => {
    useAudioStore.getState().setMuted(true);
  });

  it('lets the reader switch sound on and off (silence only with VITE_DEV_AUDIO=off)', () => {
    expect(IS_DEV_AUDIO_DISABLED).toBe(false);

    useAudioStore.getState().setMuted(false);
    expect(useAudioStore.getState().isMuted).toBe(false);

    expect(useAudioStore.getState().toggleMute()).toBe(true);
    expect(useAudioStore.getState().isMuted).toBe(true);
  });
});
