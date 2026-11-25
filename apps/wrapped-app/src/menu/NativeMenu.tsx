import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, Text, View, findNodeHandle, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { type MenuColor, type MenuEntry } from '../../../wrapped/src/shared/native-bridge/protocol';
import { cardLabel, cardRotation, drawerWidth, splitMenu, tileTitleSize, wideTitleSize } from './menuLayout';
import { type useMenuBridge } from './useMenuBridge';

const INK = '#0e0a14';
const PINK = '#ff4fa0';
const MUTED = '#cac9cb';
const CARD_COLORS: Record<MenuColor, { bg: string; fg: string }> = {
  pink: { bg: PINK, fg: INK },
  violet: { bg: '#7b3ff2', fg: '#fff' },
  white: { bg: '#fff', fg: INK },
  mint: { bg: '#46d17a', fg: INK },
};
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const SPRING = { stiffness: 420, damping: 34 } as const;

type Props = ReturnType<typeof useMenuBridge>;

/** Opacity and y 16 → 0 over 0.3 s with a delay; shown at once under reduced motion. */
function FadeUp({ delay, reduceMotion, children }: { delay: number; reduceMotion: boolean; children: ReactNode }) {
  const p = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) p.value = withDelay(delay * 1000, withTiming(1, { duration: 300, easing: EASE }));
  }, [delay, reduceMotion, p]);
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 16 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Spring in from x +48, scale 0.96, opacity 0; no motion at all under reduced motion. */
function CardReveal({ index, reduceMotion, style, children }: { index: number; reduceMotion: boolean; style?: object; children: ReactNode }) {
  const p = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) p.value = withDelay((0.06 + index * 0.035) * 1000, withSpring(1, SPRING));
  }, [index, reduceMotion, p]);
  const anim = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, p.value)),
    transform: [{ translateX: interpolate(p.value, [0, 1], [48, 0]) }, { scale: interpolate(p.value, [0, 1], [0.96, 1]) }],
  }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

function Card({ entry, index, width, reduceMotion, onChoose }: { entry: MenuEntry; index: number; width: number; reduceMotion: boolean; onChoose: (e: MenuEntry) => void }) {
  const { bg, fg } = CARD_COLORS[entry.color];
  const size = entry.tile ? tileTitleSize(width) : wideTitleSize(width);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: entry.active }}
      onPress={() => onChoose(entry)}
      style={{
        flexGrow: 1,
        backgroundColor: bg,
        borderRadius: entry.tile ? 24 : 28,
        paddingVertical: entry.tile ? 18 : 20,
        paddingHorizontal: entry.tile ? 18 : 22,
        minHeight: entry.tile ? 104 : undefined,
        gap: entry.tile ? 24 : 10,
        justifyContent: entry.tile ? 'space-between' : undefined,
        transform: [{ rotate: `${cardRotation(entry.rotate, reduceMotion)}deg` }],
      }}
    >
      <Text style={{ fontFamily: 'JetBrainsMono-Bold', fontSize: 12, lineHeight: 18, letterSpacing: 1.2, textTransform: 'uppercase', color: fg }}>
        {cardLabel(entry, index)}
      </Text>
      <Text
        android_hyphenationFrequency="normal"
        style={
          entry.tile
            ? { fontFamily: 'Archivo-Black-SemiExpanded', fontSize: size, lineHeight: size * 1.5, letterSpacing: -0.02 * size, textTransform: 'uppercase', color: fg }
            : { fontFamily: 'Archivo-Black-Expanded', fontSize: size, lineHeight: size * 0.9, letterSpacing: -0.04 * size, textTransform: 'uppercase', color: fg }
        }
      >
        {entry.title}
      </Text>
    </Pressable>
  );
}

export function NativeMenu({ state, choose, restart, close }: Props) {
  return (
    <Modal visible={state !== null} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      {state && <MenuBody state={state} choose={choose} restart={restart} close={close} />}
    </Modal>
  );
}

function MenuBody({ state, choose, restart, close }: Omit<Props, 'state' | 'open'> & { state: NonNullable<Props['state']> }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const drawer = drawerWidth(width);
  const { lead, grid } = splitMenu(state.entries);
  const closeRef = useRef<ComponentRef<typeof Pressable>>(null);

  const backdrop = useSharedValue(0);
  const slide = useSharedValue(reduceMotion ? 0 : 1);
  const fade = useSharedValue(reduceMotion ? 0 : 1);
  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 250 });
    if (reduceMotion) fade.value = withTiming(1, { duration: 150 });
    else slide.value = withTiming(0, { duration: 300, easing: EASE });
  }, [backdrop, slide, fade, reduceMotion]);
  useEffect(() => {
    const handle = closeRef.current ? findNodeHandle(closeRef.current) : null;
    const t = setTimeout(() => handle && AccessibilityInfo.setAccessibilityFocus(handle), 350);
    return () => clearTimeout(t);
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const drawerStyle = useAnimatedStyle(() =>
    reduceMotion ? { opacity: fade.value } : { transform: [{ translateX: slide.value * 1.05 * drawer }] },
  );

  const onChoose = (e: MenuEntry) => {
    void Haptics.selectionAsync();
    choose(e.href);
  };
  const card = (entry: MenuEntry, i: number, style?: object) => (
    <CardReveal key={entry.href} index={i} reduceMotion={reduceMotion} style={style}>
      <Card entry={entry} index={i} width={width} reduceMotion={reduceMotion} onChoose={onChoose} />
    </CardReveal>
  );
  const rows: MenuEntry[][] = [];
  for (let i = 0; i < grid.length; i += 2) rows.push(grid.slice(i, i + 2));

  return (
    <View style={{ flex: 1 }} accessibilityViewIsModal>
      <Animated.View style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(14,10,20,0.85)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={close} accessible={false} importantForAccessibility="no" />
      </Animated.View>
      <Animated.View
        style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, width: drawer, backgroundColor: INK, borderLeftWidth: 4, borderLeftColor: PINK }, drawerStyle]}
      >
        <ScrollView
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{ flexGrow: 1, gap: 28, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28, paddingHorizontal: 22 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text accessibilityRole="header" style={{ fontFamily: 'JetBrainsMono-Bold', fontSize: 12, lineHeight: 16, letterSpacing: 1.44, textTransform: 'uppercase', color: MUTED }}>
              Menü
            </Text>
            <Pressable
              ref={closeRef}
              accessibilityRole="button"
              accessibilityLabel="Menü schließen"
              onPress={close}
              style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 6 6 18" />
                <Path d="m6 6 12 12" />
              </Svg>
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            {lead.map((e, i) => card(e, i))}
            {rows.map((row, r) => (
              <View key={row[0].href} style={{ flexDirection: 'row', gap: 12 }}>
                {row.map((e, c) => card(e, 2 + r * 2 + c, { flex: 1, minWidth: 0 }))}
                {row.length < 2 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </View>

          {state.canRestart && (
            <FadeUp delay={0.2} reduceMotion={reduceMotion}>
              <Pressable
                accessibilityRole="button"
                onPress={restart}
                style={({ pressed }) => ({
                  height: 44,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: pressed ? '#fff' : 'rgba(255,255,255,0.25)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                })}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <Path d="M3 3v5h5" />
                </Svg>
                <Text style={{ fontFamily: 'Roboto-ExtraBold', fontSize: 16, lineHeight: 24, color: '#fff' }}>Neu starten</Text>
              </Pressable>
            </FadeUp>
          )}

          <View style={{ marginTop: 'auto' }}>
            <FadeUp delay={0.26} reduceMotion={reduceMotion}>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 20, rowGap: 4 }}>
                  {state.footer.map(link => (
                    <Pressable key={link.href} accessibilityRole="link" onPress={() => choose(link.href)} style={{ minHeight: 44, justifyContent: 'center' }}>
                      <Text style={{ fontFamily: 'Roboto-SemiBold', fontSize: 14, lineHeight: 20, color: '#fff', textDecorationLine: 'underline' }}>{link.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 14, lineHeight: 20, color: MUTED }}>Daten aus der 21. Wahlperiode</Text>
              </View>
            </FadeUp>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
