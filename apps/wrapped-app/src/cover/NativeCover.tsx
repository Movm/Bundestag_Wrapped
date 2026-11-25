import { useEffect, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { cancelAnimation, useAnimatedStyle, useFrameCallback, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { COVER_TIMING } from './coverMath';
import { clockValue, wipeDoneAt } from './coverClock';
import { ASSEMBLY_END, sampleElement } from './coverMotion';
import { coverLayout } from './coverLayout';
import { CoverTitle, transformOf } from './CoverTitle';
import { SeatsLayer, type StageRect, WipeLayer } from './SeatsLayer';
import { type useCoverBridge } from './useCoverBridge';

type Props = ReturnType<typeof useCoverBridge>;

const INK = '#0e0a14';
const FADE_MS = 220;
const EAGLE = require('../../../wrapped/public/cover-adler.webp');
const EAGLE_RATIO = 316 / 506;

let splashHidden = false;

/**
 * The story cover, painted natively above the web view. Visible from the first frame after the
 * splash; `coverMachine` (via `useCoverBridge`) decides when it goes. After the fade it unmounts,
 * so no frame callback or canvas keeps running behind the story.
 */
export function NativeCover({ state, assemblyRun, press }: Props) {
  const hidden = state.phase.name === 'hidden';
  const [gone, setGone] = useState(false);
  const opacity = useSharedValue(1);
  // The fade never starts before the wipe has covered the screen.
  const wipeDone = useRef(0);
  const exitSince = state.phase.name === 'exiting' && !state.reducedMotion ? state.phase.since : null;
  useEffect(() => { if (exitSince !== null) wipeDone.current = wipeDoneAt(exitSince); }, [exitSince]);
  useEffect(() => {
    if (!hidden) {
      cancelAnimation(opacity);
      opacity.value = 1;
      setGone(false);
      return;
    }
    const wait = Math.max(0, wipeDone.current - Date.now());
    opacity.value = withDelay(wait, withTiming(0, { duration: FADE_MS }, finished => { if (finished) scheduleOnRN(setGone, true); }));
  }, [hidden, opacity]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const onLayout = () => {
    if (splashHidden) return;
    splashHidden = true;
    void SplashScreen.hideAsync().catch(() => {});
  };

  if (gone) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, fade]}
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityViewIsModal={!hidden}
      onLayout={onLayout}
    >
      {/* A new key per assembly ("Neu starten"): fresh clocks, fresh geometry. */}
      <CoverScene key={assemblyRun} state={state} press={press} />
    </Animated.View>
  );
}

function CoverScene({ state, press }: Pick<Props, 'state' | 'press'>) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = useMemo(() => coverLayout(window, insets), [window, insets]);
  const size = useMemo(() => ({ width: window.width, height: Math.max(window.height, layout.minHeight) }), [window, layout.minHeight]);
  const { reducedMotion } = state;

  const assembly = useSharedValue(reducedMotion ? ASSEMBLY_END : 0);
  const exit = useSharedValue(-1);
  const clocks = useMemo(() => ({ assembly, exit }), [assembly, exit]);
  // Wall-clock anchors (Date.now(), as the machine), −1 = not started. The frame callback is
  // re-registered on re-renders; anchored clocks don't mind (see coverClock.ts).
  const assemblyStart = useSharedValue(-1);
  const exitStart = useSharedValue(-1);
  useFrameCallback(() => {
    'worklet';
    const now = Date.now();
    if (assemblyStart.value >= 0 && assembly.value < ASSEMBLY_END) assembly.value = clockValue(now, assemblyStart.value, ASSEMBLY_END);
    if (exitStart.value >= 0 && exit.value < COVER_TIMING.exitDone) exit.value = clockValue(now, exitStart.value, COVER_TIMING.exitDone);
    // Task 4: the idle wave reads its own anchor here.
  });

  const [stage, setStage] = useState<StageRect | null>(null);
  const onStageLayout = (event: LayoutChangeEvent) => {
    // Relative to `main`, which sits at the box origin (its padding is inside the layout frame).
    const { x, y, width, height } = event.nativeEvent.layout;
    const next = { x, y, width, height };
    setStage(prev => (prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height ? prev : next));
  };

  const measured = stage !== null;
  useEffect(() => {
    // Once per scene (a new assembly remounts it): the first layout starts the assembly.
    if (measured && !reducedMotion && assemblyStart.value < 0) assemblyStart.value = Date.now();
  }, [measured, reducedMotion, assemblyStart]);

  // The exit runs on the press timestamp itself, the one the machine hands over from.
  const exitSince = state.phase.name === 'exiting' && !reducedMotion ? state.phase.since : null;
  useEffect(() => {
    if (exitSince !== null && exitStart.value < 0) exitStart.value = exitSince;
  }, [exitSince, exitStart]);

  const eagle = useAnimatedStyle(() => transformOf(sampleElement('eagle', assembly.value, exit.value)));

  return (
    <View style={[styles.box, size]}>
      {stage && <SeatsLayer size={size} stage={stage} assembly={assembly} exit={exit} />}
      <View style={[styles.main, { paddingTop: layout.padding.top, paddingRight: layout.padding.right, paddingBottom: layout.padding.bottom, paddingLeft: layout.padding.left, gap: layout.gapStageTitle }]}>
        <View onLayout={onStageLayout} style={{ width: layout.stageWidth, height: layout.stageHeight }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View style={[styles.eagle, { width: layout.stageWidth * 0.2, height: layout.stageWidth * 0.2 * EAGLE_RATIO, marginLeft: -layout.stageWidth * 0.1 }, eagle]}>
            <Image source={EAGLE} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
          </Animated.View>
        </View>
        <CoverTitle layout={layout} year={state.year} clocks={clocks} reducedMotion={reducedMotion} onPress={press} />
      </View>
      {stage && <WipeLayer size={size} stage={stage} exit={exit} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: INK, overflow: 'hidden' },
  box: { position: 'absolute', left: 0, top: 0 },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eagle: { position: 'absolute', left: '50%', bottom: '3%' },
});
