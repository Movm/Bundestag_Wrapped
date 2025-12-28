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
import { SlideContainer, SlideHeader, bubbleAnimations, fadeInEntering } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface VocabularyRevealSlideProps {
  slideIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Party Bubble Overlay Component (tap handling + back content)
// ─────────────────────────────────────────────────────────────

interface PartyBubbleOverlayProps {
  party: PartyStats;
  index: number;
  position: { top: number; left: number };
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  entranceComplete: boolean;
  flipProgress: SharedValue<number>;
  bubbleColor: string;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);

const PartyBubbleOverlay = React.memo(function PartyBubbleOverlay({
  party,
  index,
  position,
  availableHeight,
  entranceProgress,
  entranceComplete,
  flipProgress,
  bubbleColor,
}: PartyBubbleOverlayProps) {
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

  const backWords = party.signatureWords.slice(0, 5);
  const signatureWord = party.signatureWords[0]?.word ?? '–';

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
        },
        overlayStyle,
      ]}
    >
      <Pressable onPress={handlePress} style={styles.bubblePressable}>
        {/* Front - colored circle with signature word (mirrors Skia content) */}
        <Animated.View
          style={[
            styles.bubbleFront,
            { backgroundColor: bubbleColor },
            frontStyle,
          ]}
        >
          <Text style={styles.frontWord}>{signatureWord}</Text>
        </Animated.View>

        {/* Back - party name + word list */}
        <Animated.View
          style={[
            styles.bubbleBack,
            { backgroundColor: bubbleColor },
            backStyle,
          ]}
        >
          <Text style={styles.partyTitle}>{party.party}</Text>
          <View style={styles.wordList}>
            {backWords.map((w, i) => (
              <Text
                key={w.word}
                style={[styles.wordItem, i === 0 && styles.wordItemFirst]}
                numberOfLines={1}
              >
                {w.word}
              </Text>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function VocabularyRevealSlide({ slideIndex }: VocabularyRevealSlideProps) {
  const availableHeight = useAvailableHeight();
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

  // Use precomputed top 5 parties from store (computed once on mount)
  const topParties = useTop5Parties();

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
    return topParties.map((party, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      const signatureWord = party.signatureWords[0]?.word ?? '–';
      return {
        id: party.party,
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: getPartyColor(party.party),
        frontText: signatureWord,
      };
    });
  }, [topParties, availableHeight]);

  return (
    <SlideContainer slideId="reveal-vocabulary">
      {/* Header - renders immediately, positioned below safe area */}
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="📚"
          title="Partei-Vokabular"
          subtitle="Diese Wörter zeichnen die Parteien aus."
          slideId="reveal-vocabulary"
        />
      </View>

      {/* Animated Skia Canvas - circles + text animate together, fade when flipping */}
      {showBubbles && (
        <AnimatedSkiaBubbles
          bubbles={bubbleConfigs}
          progress={entranceProgress}
          phaseOffset={0.12}
          fontSize={16}
          flipProgresses={flipProgresses}
        />
      )}

      {/* Native overlays - tap handling + flip animation */}
      {showBubbles &&
        topParties.map((party, i) => (
          <PartyBubbleOverlay
            key={party.party}
            party={party}
            index={i}
            position={BUBBLE_POSITIONS.fiveItems[i]}
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
  },
  bubbleOverlay: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
  },
  bubblePressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleFront: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  frontWord: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bubbleBack: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
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
  wordList: {
    alignItems: 'center',
  },
  wordItem: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14,
  },
  wordItemFirst: {
    fontSize: 12,
    fontWeight: '700',
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
