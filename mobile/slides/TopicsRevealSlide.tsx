import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getPartyBgColor, BUBBLE_POSITIONS, TOPIC_BY_ID, type TopicMeta } from '@/shared';
import { SlideContainer, SlideHeader, tiltInStaggerEntering, fadeInEntering } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useAllTopicRankings, useDisplayTopics } from '../stores/precomputedDataStore';
import { SkiaBubbles, BubbleConfig } from '../components/SkiaBubbles';

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
// Topic Bubble Overlay Component (text + tap handling only)
// ─────────────────────────────────────────────────────────────

interface TopicBubbleOverlayProps {
  topic: TopicMeta;
  rank: number;
  index: number;
  position: { top: number; left: number };
  partyRankings: PartyRanking[];
  availableHeight: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.33, 150);

const TopicBubbleOverlay = React.memo(function TopicBubbleOverlay({
  topic,
  rank,
  index,
  position,
  partyRankings,
  availableHeight,
}: TopicBubbleOverlayProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped((prev) => !prev);
  };

  return (
    <Animated.View
      entering={tiltInStaggerEntering(index, 200)}
      style={[
        styles.bubbleOverlay,
        {
          top: availableHeight * (position.top / 100),
          left: SCREEN_WIDTH * (position.left / 100),
        },
      ]}
    >
      <Pressable onPress={handlePress} style={styles.bubblePressable}>
        {!isFlipped ? (
          <View style={styles.bubbleContent}>
            <Text style={styles.bubbleRank}>{rank}</Text>
            <Text style={styles.bubbleName}>{topic.name}</Text>
          </View>
        ) : (
          <View style={styles.bubbleBackContent}>
            {partyRankings.slice(0, 5).map((pr, i) => (
              <View key={pr.party} style={styles.partyRow}>
                <Text style={styles.partyRankNum}>{i + 1}.</Text>
                <View
                  style={[styles.partyDot, { backgroundColor: getPartyBgColor(pr.party) }]}
                />
                <Text style={styles.partyName} numberOfLines={1}>
                  {pr.party}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  // This allows header to appear first for faster perceived start
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Use precomputed data from store (computed once on mount, O(1) access)
  const displayTopics = useDisplayTopics();
  const allPartyRankings = useAllTopicRankings();

  // Create bubble configs for Skia Canvas
  const bubbleConfigs = React.useMemo<BubbleConfig[]>(() => {
    return displayTopics.map((topicScore, i) => {
      const topic = TOPIC_BY_ID[topicScore.topic];
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      return {
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: topic?.color || '#888888',
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
        />
      </View>

      {/* Skia Canvas - static gradient backgrounds */}
      {showBubbles && (
        <SkiaBubbles bubbles={bubbleConfigs} />
      )}

      {/* Native overlays - text + tap handling */}
      {showBubbles && displayTopics.map((topicScore, i) => {
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
          />
        );
      })}

      {/* Hint - deferred with bubbles */}
      {showBubbles && (
        <Animated.Text
          entering={fadeInEntering(2200)}
          style={styles.hint}
        >
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
    borderRadius: BUBBLE_SIZE / 2,
  },
  bubbleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  bubbleRank: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.7)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bubbleName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  bubbleBackContent: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 8,
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
