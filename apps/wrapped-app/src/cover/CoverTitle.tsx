import { type ReactNode, useEffect } from 'react';
import { type LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { COVER_TIMING, EASE_IN, type Sample, sampleKeyframes } from './coverMath';
import { type CoverElement, ENTRANCE_POP, sampleElement } from './coverMotion';
import { type CoverLayout } from './coverLayout';

const INK = '#0e0a14';
const PINK = '#ff4fa0';

interface Clocks { assembly: SharedValue<number>; exit: SharedValue<number> }

/** CSS transform of a sample (translate, then scale, then rotate; the origin is the centre in both). */
export function transformOf(s: Sample) {
  'worklet';
  return { opacity: s.opacity, transform: [{ translateX: s.tx }, { translateY: s.ty }, { scale: s.scale }, { rotate: `${s.rotate}deg` }] };
}

function Animate({ element, clocks, children, style }: { element: CoverElement; clocks: Clocks; children: ReactNode; style?: object }) {
  const animated = useAnimatedStyle(() => transformOf(sampleElement(element, clocks.assembly.value, clocks.exit.value)));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * The year arrives with the web's first report, usually after the assembly. It pops in on its own
 * clock: at its slot in the assembly (1600 ms) if it is known by then, otherwise the moment it arrives.
 */
function YearPill({ year, size, clocks, reducedMotion }: { year: number; size: number; clocks: Clocks; reducedMotion: boolean }) {
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    const wait = Math.max(0, COVER_TIMING.yearDelay - clocks.assembly.value);
    pop.value = withDelay(wait, withTiming(1, { duration: COVER_TIMING.entranceDuration, easing: Easing.linear }));
  }, [clocks.assembly, pop, reducedMotion]);
  const animated = useAnimatedStyle(() => transformOf(clocks.exit.value >= 0
    ? sampleElement('year', 0, clocks.exit.value)
    : sampleKeyframes(ENTRANCE_POP, pop.value, EASE_IN)));
  const fontSize = size * 0.42;
  return (
    <Animated.View style={[styles.pill, { paddingTop: fontSize * 0.08, paddingHorizontal: fontSize * 0.32, paddingBottom: fontSize * 0.12 }, animated]}>
      <Text style={[styles.display, styles.pillText, { fontSize, lineHeight: fontSize, letterSpacing: -0.03 * fontSize }]}>{year}</Text>
    </Animated.View>
  );
}

/** „Bundestag Wrapped" with the year pill, and „Los geht’s". */
export function CoverTitle({ layout, year, clocks, reducedMotion, onPress, onLayout }: { layout: CoverLayout; year: number | null; clocks: Clocks; reducedMotion: boolean; onPress: () => void; onLayout?: (event: LayoutChangeEvent) => void }) {
  const size = layout.titleSize;
  const word = { fontSize: size, lineHeight: size * 0.84, letterSpacing: -0.045 * size };
  const label = year === null ? 'Bundestag Wrapped' : `Bundestag Wrapped ${year}`;
  return (
    <View onLayout={onLayout} style={[styles.title, { gap: layout.gapTitleButton }]}>
      <View accessible accessibilityRole="header" accessibilityLabel={label} style={[styles.h1, { columnGap: 0.22 * size, rowGap: 0.08 * size }]}>
        <Animate element="bundestag" clocks={clocks}><Text style={[styles.display, word]}>Bundestag</Text></Animate>
        <Animate element="wrapped" clocks={clocks}><Text style={[styles.display, word, { color: PINK }]}>Wrapped</Text></Animate>
        {year !== null && <YearPill year={year} size={size} clocks={clocks} reducedMotion={reducedMotion} />}
      </View>
      <Animate element="button" clocks={clocks}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Los geht’s"
          onPress={onPress}
          style={[styles.button, { height: layout.button.height, paddingHorizontal: layout.button.paddingX }]}
        >
          <Text style={[styles.action, { fontSize: layout.button.fontSize }]}>Los geht’s</Text>
        </Pressable>
      </Animate>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { alignItems: 'center' },
  h1: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  // The bundled face is the 800 weight itself; a fontWeight on top would make Android look for another file.
  display: { fontFamily: 'Cover Display', color: '#fff', textTransform: 'uppercase', ...(Platform.OS === 'android' ? { includeFontPadding: false } : null) },
  pill: { backgroundColor: PINK, borderRadius: 999 },
  pillText: { color: INK },
  button: { borderRadius: 999, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  action: { fontFamily: 'Cover Action', color: INK, ...(Platform.OS === 'android' ? { includeFontPadding: false } : null) },
});
