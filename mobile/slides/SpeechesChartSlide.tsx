import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { PartyStats } from '@/data/wrapped';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import {
  SlideContainer,
  bubbleAnimations,
  emojiPopEntering,
  fadeUpEntering,
  fadeInEntering,
} from './shared';
import { useAppStore, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties, useSpeechBubbleSizes, useTotalSpeeches } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SpeechesChartSlideProps {
  slideIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Bubble Overlay Component (tap handling + back content)
// ─────────────────────────────────────────────────────────────

interface BubbleOverlayProps {
  party: PartyStats;
  index: number;
  position: { top: number; left: number };
  bubbleSize: number;
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  entranceComplete: boolean;
  flipProgress: SharedValue<number>;
  bubbleColor: string;
}

const BubbleOverlay = React.memo(function BubbleOverlay({
  party,
  index,
  position,
  bubbleSize,
  availableHeight,
  entranceProgress,
  entranceComplete,
  flipProgress,
  bubbleColor,
}: BubbleOverlayProps) {
  const isFlippedRef = React.useRef(false);

  const handlePress = () => {
    if (!entranceComplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFlipped = !isFlippedRef.current;
    isFlippedRef.current = newFlipped;
    flipProgress.value = withTiming(newFlipped ? 1 : 0, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  };

  // Sync overlay scale with Skia entrance animation
  const overlayStyle = useAnimatedStyle(() => {
    const phaseOffset = 0.12;
    const totalBubbles = 5;
    const delay = index * phaseOffset;
    const animationWindow = 1 - (totalBubbles - 1) * phaseOffset;

    let adjustedProgress = 0;
    if (entranceProgress.value > delay) {
      adjustedProgress = Math.min(
        (entranceProgress.value - delay) / animationWindow,
        1
      );
    }

    const scale = 1 - Math.pow(1 - adjustedProgress, 3);
    const opacity = Math.min(adjustedProgress * 2, 1);

    return {
      transform: [{ scale }],
      opacity,
    };
  }, [index]);

  // Front content: becomes visible as Skia fades, then flips away
  const frontStyle = useAnimatedStyle(() => {
    // Visible when flipping starts (Skia fades out, native fades in)
    const frontOpacity = flipProgress.value > 0 ? 1 : 0;
    // ScaleX flip: 1 -> 0 in first half
    const scaleX = interpolate(flipProgress.value, [0, 0.5], [1, 0], 'clamp');

    return {
      opacity: frontOpacity,
      transform: [{ scaleX }],
    };
  });

  // Back content: flips in during second half
  const backStyle = useAnimatedStyle(() => {
    // Only visible in second half of flip
    const backOpacity = flipProgress.value >= 0.5 ? 1 : 0;
    // ScaleX flip: 0 -> 1 in second half
    const scaleX = interpolate(flipProgress.value, [0.5, 1], [0, 1], 'clamp');

    return {
      opacity: backOpacity,
      transform: [{ scaleX }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.bubbleOverlay,
        {
          top: availableHeight * (position.top / 100),
          left: SCREEN_WIDTH * (position.left / 100),
          width: bubbleSize,
          height: bubbleSize,
        },
        overlayStyle,
      ]}
    >
      <Pressable onPress={handlePress} style={styles.bubblePressable}>
        {/* Front - colored circle with speech count (mirrors Skia content) */}
        <Animated.View
          style={[
            styles.bubbleFront,
            {
              backgroundColor: bubbleColor,
              borderRadius: bubbleSize / 2,
              width: bubbleSize,
              height: bubbleSize,
            },
            frontStyle,
          ]}
        >
          <Text style={styles.frontCount}>
            {party.speeches.toLocaleString('de-DE')}
          </Text>
          <Text style={styles.frontLabel}>Reden</Text>
        </Animated.View>

        {/* Back - party name + wortbeiträge */}
        <Animated.View
          style={[
            styles.bubbleBack,
            {
              backgroundColor: bubbleColor,
              borderRadius: bubbleSize / 2,
              width: bubbleSize,
              height: bubbleSize,
            },
            backStyle,
          ]}
        >
          <Text style={styles.partyTitle}>{party.party}</Text>
          <Text style={styles.wortCount}>
            {party.wortbeitraege.toLocaleString('de-DE')}
          </Text>
          <Text style={styles.wortLabel}>Wortbeiträge</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function SpeechesChartSlide({ slideIndex }: SpeechesChartSlideProps) {
  // Direct selector - avoids object creation that can cause re-render loops
  const availableHeight = useAppStore((s) => s.availableHeight);
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Single SharedValue drives all bubble animations
  const entranceProgress = useSharedValue(0);
  const [entranceComplete, setEntranceComplete] = useState(false);

  // Flip progress for each bubble (stable refs)
  const flipProgress0 = useSharedValue(0);
  const flipProgress1 = useSharedValue(0);
  const flipProgress2 = useSharedValue(0);
  const flipProgress3 = useSharedValue(0);
  const flipProgress4 = useSharedValue(0);
  const flipProgresses = useRef([
    flipProgress0,
    flipProgress1,
    flipProgress2,
    flipProgress3,
    flipProgress4,
  ]).current;

  // Use precomputed data from store (computed once on mount, O(1) access)
  const top5 = useTop5Parties();
  const bubbleSizes = useSpeechBubbleSizes();
  const totalReden = useTotalSpeeches();

  // Trigger entrance animation when bubbles become visible
  useEffect(() => {
    if (showBubbles) {
      entranceProgress.value = withTiming(
        1,
        {
          duration: 800,
          easing: Easing.out(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(setEntranceComplete)(true);
          }
        }
      );
    }
  }, [showBubbles, entranceProgress]);

  // Create animated bubble configs for Skia Canvas
  const bubbleConfigs = React.useMemo<AnimatedBubbleConfig[]>(() => {
    return top5.map((party, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      const size = bubbleSizes[i];
      return {
        id: party.party,
        x: SCREEN_WIDTH * (pos.left / 100) + size / 2,
        y: availableHeight * (pos.top / 100) + size / 2,
        size,
        color: getPartyColor(party.party),
        frontText: party.speeches.toLocaleString('de-DE'),
        frontSubtext: 'Reden',
      };
    });
  }, [top5, bubbleSizes, availableHeight]);

  return (
    <SlideContainer slideId="chart-speeches">
      {/* Header - renders immediately */}
      <View style={[styles.header, { top: topInset + 16 }]}>
        <Animated.Text entering={emojiPopEntering(0)} style={styles.emoji}>
          🎤
        </Animated.Text>
        <Animated.Text entering={fadeUpEntering(150)} style={styles.subtitle}>
          DIE REDEN
        </Animated.Text>
        <Animated.Text entering={fadeUpEntering(250)} style={styles.title}>
          {totalReden.toLocaleString('de-DE')} formelle Reden
        </Animated.Text>
        <Animated.Text entering={fadeInEntering(500)} style={styles.note}>
          Wir unterscheiden zwischen richtigen Reden{'\n'}und weiteren Wortbeiträgen
        </Animated.Text>
      </View>

      {/* Animated Skia Canvas - circles + text animate together, fade when flipping */}
      {showBubbles && (
        <AnimatedSkiaBubbles
          bubbles={bubbleConfigs}
          progress={entranceProgress}
          phaseOffset={0.12}
          flipProgresses={flipProgresses}
        />
      )}

      {/* Native overlays - tap handling + flip animation */}
      {showBubbles &&
        top5.map((party, i) => (
          <BubbleOverlay
            key={party.party}
            party={party}
            index={i}
            position={BUBBLE_POSITIONS.fiveItems[i]}
            bubbleSize={bubbleSizes[i]}
            availableHeight={availableHeight}
            entranceProgress={entranceProgress}
            entranceComplete={entranceComplete}
            flipProgress={flipProgresses[i]}
            bubbleColor={getPartyColor(party.party)}
          />
        ))}

      {/* Hint - deferred with bubbles */}
      {showBubbles && (
        <Animated.Text entering={bubbleAnimations.hint()} style={styles.hint}>
          Tippe auf eine Blase für Details
        </Animated.Text>
      )}
    </SlideContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  note: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  bubbleOverlay: {
    position: 'absolute',
  },
  bubblePressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleFront: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  frontCount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  frontLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  bubbleBack: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  partyTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  wortCount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  wortLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
