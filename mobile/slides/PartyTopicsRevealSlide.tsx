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
import { getPartyBgColor, BUBBLE_POSITIONS, TOPIC_BY_ID } from '@/shared';
import { SlideContainer, SlideHeader, fadeInEntering } from './shared';
import { useAvailableHeight, useTopInset, useBottomSafeZone } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { usePartyTopTopics } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TopicScore {
  topic: string;
  score: number;
}

interface PartyTopicsRevealSlideProps {
  slideIndex: number;
}

// The 5 main parties to display
const DISPLAY_PARTIES = ['AfD', 'CDU/CSU', 'DIE LINKE', 'GRÜNE', 'SPD'];

// ─────────────────────────────────────────────────────────────
// Party Bubble Overlay Component (tap handling + flip animation)
// ─────────────────────────────────────────────────────────────

interface PartyBubbleOverlayProps {
  party: string;
  index: number;
  position: { top: number; left: number };
  topTopics: TopicScore[];
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  entranceComplete: boolean;
  flipProgress: SharedValue<number>;
  bubbleColor: string;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.33, 150);

const PartyBubbleOverlay = React.memo(function PartyBubbleOverlay({
  party,
  index,
  position,
  topTopics,
  availableHeight,
  entranceProgress,
  entranceComplete,
  flipProgress,
  bubbleColor,
}: PartyBubbleOverlayProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handlePress = () => {
    if (!entranceComplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
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
    const frontOpacity = flipProgress.value > 0 ? 1 : 0;
    const scaleX = interpolate(flipProgress.value, [0, 0.5], [1, 0], 'clamp');

    return {
      opacity: frontOpacity,
      transform: [{ scaleX }],
    };
  });

  // Back content: flips in during second half
  const backStyle = useAnimatedStyle(() => {
    const backOpacity = flipProgress.value >= 0.5 ? 1 : 0;
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
        {/* Front - party name */}
        <Animated.View
          style={[
            styles.bubbleFront,
            { backgroundColor: bubbleColor },
            frontStyle,
          ]}
        >
          <Text style={styles.frontName}>{party}</Text>
        </Animated.View>

        {/* Back - top 5 topics */}
        <Animated.View
          style={[
            styles.bubbleBack,
            { backgroundColor: bubbleColor },
            backStyle,
          ]}
        >
          {topTopics.map((ts, i) => {
            const topic = TOPIC_BY_ID[ts.topic];
            if (!topic) return null;
            return (
              <View key={ts.topic} style={styles.topicRow}>
                <Text style={styles.topicRankNum}>{i + 1}.</Text>
                <View
                  style={[
                    styles.topicDot,
                    { backgroundColor: topic.color },
                  ]}
                />
                <Text style={styles.topicName} numberOfLines={1}>
                  {topic.name}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function PartyTopicsRevealSlide({ slideIndex }: PartyTopicsRevealSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();
  const bottomSafeZone = useBottomSafeZone();

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

  // Use precomputed data from store
  const partyTopTopics = usePartyTopTopics();

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
    return DISPLAY_PARTIES.map((party, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      const partyColor = getPartyBgColor(party);
      return {
        id: party,
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: partyColor,
        frontText: party,
      };
    });
  }, [availableHeight]);

  return (
    <SlideContainer slideId="reveal-party-topics">
      {/* Header - renders immediately, positioned below safe area */}
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="🏛️"
          title="Die Themen der Parteien"
          subtitle="Worüber sprechen die Fraktionen am meisten?"
          slideId="reveal-party-topics"
        />
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
        DISPLAY_PARTIES.map((party, i) => {
          const topTopics = partyTopTopics[party];
          if (!topTopics) return null;
          return (
            <PartyBubbleOverlay
              key={party}
              party={party}
              index={i}
              position={BUBBLE_POSITIONS.fiveItems[i]}
              topTopics={topTopics}
              availableHeight={availableHeight}
              entranceProgress={entranceProgress}
              entranceComplete={entranceComplete}
              flipProgress={flipProgresses[i]}
              bubbleColor={getPartyBgColor(party)}
            />
          );
        })}

      {/* Hint - deferred with bubbles */}
      {showBubbles && (
        <Animated.Text entering={fadeInEntering(1200)} style={[styles.hint, { bottom: bottomSafeZone + 8 }]}>
          Tippe auf eine Partei für Details
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
  frontName: {
    fontSize: 14,
    fontWeight: '900',
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
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  topicRankNum: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    width: 14,
  },
  topicDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  topicName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    maxWidth: 70,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
