import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { type NativeToWeb, type WebToNative } from '../../../wrapped/src/shared/native-bridge/protocol';
import { SOUND_VOLUMES } from '../../../wrapped/src/shared/sounds/types';
import { type CoverEffect, type CoverEvent, type CoverState, initialCoverState, reduce } from './coverMachine';

const TICK_MS = 100;
const START_SOUND = require('../../../wrapped/public/sounds/start.wav');

/**
 * Runs `coverMachine` against the wall clock (a 100 ms tick plus `appActive`) and executes its
 * effects. `assemblyRun` counts the assemblies, so the cover restarts its clock on "Neu starten".
 */
export function useCoverBridge(receive: (message: NativeToWeb) => void) {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<CoverState>(() => initialCoverState({ reducedMotion }));
  const [assemblyRun, setAssemblyRun] = useState(0);
  const stateRef = useRef(state);

  const player = useAudioPlayer(START_SOUND);
  useEffect(() => { player.volume = SOUND_VOLUMES.start; }, [player]);

  const run = useCallback((effect: CoverEffect) => {
    switch (effect) {
      case 'playStartSound':
        void player.seekTo(0).catch(() => {});
        player.play();
        return;
      case 'haptic':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        return;
      case 'sendStoryStart':
        receive({ type: 'story.start' });
        return;
      case 'startAssembly':
        setAssemblyRun(n => n + 1);
        return;
      case 'fadeOut':
        return; // NativeCover fades on `phase: hidden`.
    }
  }, [player, receive]);

  // Reduces synchronously against the ref, so two events in one frame (a double tap) see each other.
  const dispatch = useCallback((event: CoverEvent) => {
    const result = reduce(stateRef.current, event, Date.now());
    if (result.state !== stateRef.current) {
      stateRef.current = result.state;
      setState(result.state);
    }
    result.effects.forEach(run);
  }, [run]);

  const hidden = state.phase.name === 'hidden';
  useEffect(() => {
    if (hidden) return;
    dispatch({ type: 'tick' });
    const id = setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    return () => clearInterval(id);
  }, [hidden, dispatch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => { if (next === 'active') dispatch({ type: 'appActive' }); });
    return () => sub.remove();
  }, [dispatch]);

  const onWebCover = useCallback((m: Extract<WebToNative, { type: 'cover' }>) => {
    // The page is remote code: a malformed or foreign message is dropped, never reduced.
    if (typeof m !== 'object' || m === null || m.type !== 'cover' || typeof m.visible !== 'boolean') return;
    if (m.year !== null && typeof m.year !== 'number') return;
    if (m.muted !== undefined && typeof m.muted !== 'boolean') return;
    dispatch({ type: 'web.cover', visible: m.visible, year: m.year, muted: m.muted });
  }, [dispatch]);
  const press = useCallback(() => dispatch({ type: 'press' }), [dispatch]);

  return { state, assemblyRun, onWebCover, press };
}
