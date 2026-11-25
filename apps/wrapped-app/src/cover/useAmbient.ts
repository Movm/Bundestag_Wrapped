import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { type SharedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { addFlight, type Flight, type FlyerKind, makeFlight, makeShot, type Shot } from './ambient';
import { type AmbientLoop, ambientSchedule } from './coverMath';
import { type Box, blockedArea, freePath, type Rect, shootingStarStart } from './flightPaths';

export interface AmbientClocks {
  /** ms since the ambient layer (re)started, −1 while it is stopped. */
  clock: SharedValue<number>;
  flights: Record<FlyerKind, SharedValue<Flight[]>>;
  shots: SharedValue<Shot[]>;
}

export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => setActive(next === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

/**
 * `startAmbient()` / `stopAmbient()` of cover.ts. While `running`, a wall-clock anchored clock ticks
 * on the UI thread and JS timers fire the loops of `ambientSchedule` (paths need the layout rects, so
 * they are planned here, on the JS thread, and only sampled in worklets). Stopping cancels every
 * flight and puts the glows and the planet back to rest; starting again begins from scratch, like
 * `pause()` / `resume()` on the web.
 */
export function useAmbient(running: boolean, geometry: { box: Box; stage: Rect | null; title: Rect | null }): AmbientClocks {
  const start = useSharedValue(-1);
  const clock = useSharedValue(-1);
  const rocket = useSharedValue<Flight[]>([]);
  const ufo = useSharedValue<Flight[]>([]);
  const satellite = useSharedValue<Flight[]>([]);
  const shots = useSharedValue<Shot[]>([]);

  // The paths read the latest layout when they fire, as the web reads getBoundingClientRect().
  const geo = useRef(geometry);
  geo.current = geometry;

  useFrameCallback(() => {
    'worklet';
    const anchor = start.value;
    if (anchor < 0) {
      if (clock.value !== -1) clock.value = -1;
      return;
    }
    clock.value = Date.now() - anchor;
  });

  useEffect(() => {
    if (!running) return;
    const anchor = Date.now();
    start.value = anchor;
    const at = () => Date.now() - anchor;
    const schedule = ambientSchedule(Math.random);
    const flyers = { rocket, ufo, satellite };
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const fly = (kind: FlyerKind, now: number) => {
      const { box, stage, title } = geo.current;
      if (!stage || !title) return;
      const path = freePath(box, blockedArea(stage, title, 50), Math.random);
      if (!path) return;
      flyers[kind].value = addFlight(flyers[kind].value, makeFlight(kind, path, now), now);
    };
    const shootingStar = (now: number) => {
      const { box, stage, title } = geo.current;
      if (!stage || !title) return;
      const found = shootingStarStart(box, blockedArea(stage, title, 30), Math.random);
      if (!found) return;
      shots.value = addFlight(shots.value, makeShot(found, now), now);
    };
    const run: Record<AmbientLoop, (now: number) => void> = {
      shootingStar,
      rocket: now => fly('rocket', now),
      ufo: now => fly('ufo', now),
      satellite: now => fly('satellite', now),
    };

    const arm = (fn: () => void, ms: number) => {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
    };
    // cover.ts `loop`: run, then schedule the next run from now.
    const loop = (name: AmbientLoop) => {
      const go = () => {
        const now = at();
        run[name](now);
        arm(go, schedule.next(name, now) - now);
      };
      arm(go, schedule.first[name]);
    };
    (['shootingStar', 'rocket', 'ufo', 'satellite'] as const).forEach(loop);

    return () => {
      timers.forEach(clearTimeout);
      start.value = -1;
      rocket.value = [];
      ufo.value = [];
      satellite.value = [];
      shots.value = [];
    };
  }, [running, start, rocket, ufo, satellite, shots]);

  return { clock, flights: { rocket, ufo, satellite }, shots };
}
