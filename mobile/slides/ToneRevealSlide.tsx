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
import type { PartyProfile } from '@/data/wrapped';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import { SlideContainer, SlideHeader } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useSortedToneProfiles } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PARTY_SUMMARIES: Record<string, string> = {
  'CDU/CSU': 'Setzt auf positive Rhetorik und sucht Konsens statt Konfrontation.',
  'SPD': 'Fokussiert auf praktische Lösungen und parteiübergreifende Zusammenarbeit.',
  'GRÜNE': 'Balanciert Idealismus mit pragmatischen Ansätzen im Parlament.',
  'AfD': 'Greift scharf an, etikettiert Gegner und setzt auf Konfrontation.',
  'DIE LINKE': 'Stellt kämpferisch soziale Forderungen und hinterfragt die Regierung.',
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ToneRevealSlideProps {
  slideIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Tone Bubble Overlay Component (tap handling + back content)
// ─────────────────────────────────────────────────────────────

interface ToneBubbleOverlayProps {
  profile: PartyProfile;
  index: number;
  position: { top: number; left: number };
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  entranceComplete: boolean;
  flipProgress: SharedValue<number>;
  bubbleColor: string;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);

const ToneBubbleOverlay = React.memo(function ToneBubbleOverlay({
  profile,
  index,
  position,
  availableHeight,
  entranceProgress,
  entranceComplete,
  flipProgress,
  bubbleColor,
}: ToneBubbleOverlayProps) {
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
        },
        overlayStyle,
      ]}
    >
      <Pressable onPress={handlePress} style={styles.bubblePressable}>
        {/* Front - colored circle with emoji (mirrors Skia content) */}
        <Animated.View
          style={[
            styles.bubbleFront,
            { backgroundColor: bubbleColor },
            frontStyle,
          ]}
        >
          <Text style={styles.frontEmoji}>{profile.emoji}</Text>
        </Animated.View>

        {/* Back - party name + description */}
        <Animated.View
          style={[
            styles.bubbleBack,
            { backgroundColor: bubbleColor },
            backStyle,
          ]}
        >
          <Text style={styles.partyTitle}>{profile.party}</Text>
          <Text style={styles.partyDescription}>
            {PARTY_SUMMARIES[profile.party] || 'Keine Beschreibung verfügbar.'}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ToneRevealSlide({ slideIndex }: ToneRevealSlideProps) {
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

  // Use precomputed sorted profiles from store (computed once on mount)
  const sortedProfiles = useSortedToneProfiles();
  const topParties = sortedProfiles.slice(0, 5);

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
    return topParties.map((profile, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      return {
        id: profile.party,
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: getPartyColor(profile.party),
        emoji: profile.emoji,
        frontText: '', // No text, just emoji
      };
    });
  }, [topParties, availableHeight]);

  if (topParties.length === 0) {
    return (
      <SlideContainer slideId="reveal-tone">
        <Text style={styles.noData}>Keine Daten verfügbar</Text>
      </SlideContainer>
    );
  }

  return (
    <SlideContainer slideId="reveal-tone">
      {/* Header - renders immediately */}
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="🎭"
          title="Fraktions-Persönlichkeiten"
          subtitle="Tippe zum Umdrehen"
          slideId="reveal-tone"
        />
      </View>

      {/* Animated Skia Canvas - circles + emoji animate together, fade when flipping */}
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
        topParties.map((profile, i) => (
          <ToneBubbleOverlay
            key={profile.party}
            profile={profile}
            index={i}
            position={BUBBLE_POSITIONS.fiveItems[i]}
            availableHeight={availableHeight}
            entranceProgress={entranceProgress}
            entranceComplete={entranceComplete}
            flipProgress={flipProgresses[i]}
            bubbleColor={getPartyColor(profile.party)}
          />
        ))}
    </SlideContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  noData: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
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
  frontEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  bubbleBack: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  partyTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  partyDescription: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 4,
  },
});
