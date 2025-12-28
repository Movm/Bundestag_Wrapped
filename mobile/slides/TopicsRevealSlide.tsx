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
import { getPartyBgColor, BUBBLE_POSITIONS, TOPIC_BY_ID, type TopicMeta } from '@/shared';
import { SlideContainer, SlideHeader, fadeInEntering } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useAllTopicRankings, useDisplayTopics, useTickerTopics } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';
import { TopicsTicker } from '../components/TopicsTicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PartyRanking {
  party: string;
  score: number;
}

interface TopicsRevealSlideProps {
  slideIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Topic Bubble Overlay Component (tap handling + flip animation)
// ─────────────────────────────────────────────────────────────

interface TopicBubbleOverlayProps {
  topic: TopicMeta;
  rank: number;
  index: number;
  position: { top: number; left: number };
  partyRankings: PartyRanking[];
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  entranceComplete: boolean;
  flipProgress: SharedValue<number>;
  bubbleColor: string;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.33, 150);

const TopicBubbleOverlay = React.memo(function TopicBubbleOverlay({
  topic,
  rank,
  index,
  position,
  partyRankings,
  availableHeight,
  entranceProgress,
  entranceComplete,
  flipProgress,
  bubbleColor,
}: TopicBubbleOverlayProps) {
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
        {/* Front - colored circle with rank + topic name (mirrors Skia content) */}
        <Animated.View
          style={[
            styles.bubbleFront,
            { backgroundColor: bubbleColor },
            frontStyle,
          ]}
        >
          <Text style={styles.frontRank}>{rank}</Text>
          <Text style={styles.frontName}>{topic.name}</Text>
        </Animated.View>

        {/* Back - party rankings */}
        <Animated.View
          style={[
            styles.bubbleBack,
            { backgroundColor: bubbleColor },
            backStyle,
          ]}
        >
          {partyRankings.slice(0, 5).map((pr, i) => (
            <View key={pr.party} style={styles.partyRow}>
              <Text style={styles.partyRankNum}>{i + 1}.</Text>
              <View
                style={[
                  styles.partyDot,
                  { backgroundColor: getPartyBgColor(pr.party) },
                ]}
              />
              <Text style={styles.partyName} numberOfLines={1}>
                {pr.party}
              </Text>
            </View>
          ))}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function TopicsRevealSlide({ slideIndex }: TopicsRevealSlideProps) {
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

  // Use precomputed data from store (computed once on mount, O(1) access)
  const displayTopics = useDisplayTopics();
  const allPartyRankings = useAllTopicRankings();
  const tickerTopics = useTickerTopics();

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
    return displayTopics.map((topicScore, i) => {
      const topic = TOPIC_BY_ID[topicScore.topic];
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      return {
        id: topicScore.topic,
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: topic?.color || '#888888',
        frontText: String(topicScore.rank),
        frontSubtext: topic?.name,
      };
    });
  }, [displayTopics, availableHeight]);

  return (
    <SlideContainer slideId="reveal-topics">
      {/* Header - renders immediately, positioned below safe area */}
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="📊"
          title="Die Themen des Bundestags"
          subtitle="Worüber wurde am meisten gesprochen?"
          slideId="reveal-topics"
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
        displayTopics.map((topicScore, i) => {
          const topic = TOPIC_BY_ID[topicScore.topic];
          if (!topic) return null;
          return (
            <TopicBubbleOverlay
              key={topicScore.topic}
              topic={topic}
              rank={topicScore.rank}
              index={i}
              position={BUBBLE_POSITIONS.fiveItems[i]}
              partyRankings={allPartyRankings[topicScore.topic]}
              availableHeight={availableHeight}
              entranceProgress={entranceProgress}
              entranceComplete={entranceComplete}
              flipProgress={flipProgresses[i]}
              bubbleColor={topic.color || '#888888'}
            />
          );
        })}

      {/* News ticker for topics 6-13 */}
      {showBubbles && tickerTopics.length > 0 && (
        <TopicsTicker topics={tickerTopics} />
      )}

      {/* Hint - deferred with bubbles */}
      {showBubbles && (
        <Animated.Text entering={fadeInEntering(1200)} style={styles.hint}>
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
  frontRank: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.7)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  frontName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
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
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  partyRankNum: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    width: 14,
  },
  partyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  partyName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    maxWidth: 70,
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
