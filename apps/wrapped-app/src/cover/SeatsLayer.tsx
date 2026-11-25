import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, createPicture, Picture, Skia } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { buildSeats } from '../../../wrapped/src/shared/cover/seats';
import { assemblyPlan, COVER_TIMING, exitPlan, sampleKeyframes, WAVE_RESTING, wavePlan, waveSeatScale, wipeRadii } from './coverMath';
import { progressAt, seedScale, wipeProgress } from './coverMotion';

export interface StageRect { x: number; y: number; width: number; height: number }

const PINK = Skia.Color('#ff4fa0');
const REST = { tx: 0, ty: 0, scale: 1, opacity: 1, rotate: 0 };

interface ClockProps {
  /** ms since the assembly started (or its end with reduced motion). */
  assembly: SharedValue<number>;
  /** ms since "Los geht’s", −1 while not exiting. */
  exit: SharedValue<number>;
}

interface WaveProps {
  /** ms since the idle wave started (`COVER_TIMING.waveStart` into the assembly), −1 before it or without one, `WAVE_RESTING` while every seat rests. */
  wave: SharedValue<number>;
}

/**
 * The 630 seats and the seed, drawn into one Picture per frame. The canvas spans the whole cover
 * (seats fly beyond the stage), the stage rect places the hemicycle in it. Plans are built once per
 * geometry on the JS thread; only the sampling runs in the worklet.
 */
export function SeatsLayer({ size, stage, assembly, exit, wave }: ClockProps & WaveProps & { size: { width: number; height: number }; stage: StageRect }) {
  const seats = useMemo(() => buildSeats(), []);
  const colors = useMemo(() => seats.map(seat => Skia.Color(seat.color)), [seats]);
  const geometry = useMemo(() => ({ width: stage.width, height: stage.height, cx: stage.width / 2, cy: stage.height * 0.55 }), [stage.width, stage.height]);
  const built = useMemo(() => assemblyPlan(geometry, seats), [geometry, seats]);
  const fallen = useMemo(() => exitPlan(geometry, seats), [geometry, seats]);
  const waving = useMemo(() => wavePlan(seats), [seats]);
  const points = useMemo(() => seats.map(seat => ({ x: stage.x + seat.x / 100 * stage.width, y: stage.y + seat.y / 100 * stage.height })), [seats, stage]);

  const picture = useDerivedValue(() => {
    const a = assembly.value, e = exit.value, w = wave.value;
    const seatRadius = stage.width * 0.0065, seedRadius = stage.width * 0.013;
    return createPicture(canvas => {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      for (let i = 0; i < points.length; i++) {
        let s;
        if (e >= 0) {
          s = sampleKeyframes(fallen[i].frames, progressAt(e, fallen[i].delay, fallen[i].duration));
        } else if (w === WAVE_RESTING) {
          s = REST;
        } else if (w >= 0) {
          // The wave replaces the (finished) assembly transform; outside its active part the seat rests.
          const scale = waveSeatScale(waving[i], w);
          s = scale === 1 ? REST : { tx: 0, ty: 0, scale, opacity: 1, rotate: 0 };
        } else {
          s = sampleKeyframes(built[i].frames, progressAt(a, built[i].delay, built[i].duration));
        }
        if (s.scale <= 0) continue;
        paint.setColor(colors[i]);
        canvas.drawCircle(points[i].x + s.tx, points[i].y + s.ty, seatRadius * s.scale, paint);
      }
      const seed = seedScale(a, e);
      if (seed > 0) {
        paint.setColor(PINK);
        canvas.drawCircle(stage.x + geometry.cx, stage.y + geometry.cy, seedRadius * seed, paint);
      }
    }, size);
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}

/** The pink wipe: a circle at the stage centre growing from 3 % of the stage width past the farthest corner. */
export function WipeLayer({ size, stage, exit }: Pick<ClockProps, 'exit'> & { size: { width: number; height: number }; stage: StageRect }) {
  const centre = { x: stage.x + stage.width / 2, y: stage.y + stage.height * 0.55 };
  const { start, end } = wipeRadii(centre, stage.width, size);
  const radius = useDerivedValue(() => (exit.value < COVER_TIMING.wipeStart ? 0 : start + (end - start) * wipeProgress(exit.value)));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle cx={centre.x} cy={centre.y} r={radius} color="#ff4fa0" />
      </Canvas>
    </View>
  );
}
