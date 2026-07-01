import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { getPartyBgColor, BUBBLE_POSITIONS, TOPIC_BY_ID } from '@/shared';
import { SlideContainer, SlideHeader } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useAllTopicRankings, useDisplayTopics } from '../stores/precomputedDataStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TopicsDetailsSlideProps {
  slideIndex: number;
}

interface PartyRanking {
  party: string;
  score: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.33, 150);
const PHASE_OFFSET = 0.12;
const TOTAL_BUBBLES = 5;

interface TopicBubbleProps {
  topicId: string;
  index: number;
  position: { top: number; left: number };
  partyRankings: PartyRanking[];
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  bubbleColor: string;
}

const TopicBubble = React.memo(function TopicBubble({
  index,
  position,
  partyRankings,
  availableHeight,
  entranceProgress,
  bubbleColor,
}: TopicBubbleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const delay = index * PHASE_OFFSET;
    const animationWindow = 1 - (TOTAL_BUBBLES - 1) * PHASE_OFFSET;

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

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          top: availableHeight * (position.top / 100),
          left: SCREEN_WIDTH * (position.left / 100),
          backgroundColor: bubbleColor,
        },
        animatedStyle,
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
  );
});

export function TopicsDetailsSlide({ slideIndex }: TopicsDetailsSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  const showBubbles = useDeferredRender(slideIndex, 300);
  const entranceProgress = useSharedValue(0);

  const displayTopics = useDisplayTopics();
  const allPartyRankings = useAllTopicRankings();

  useEffect(() => {
    if (showBubbles) {
      entranceProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [showBubbles, entranceProgress]);

  return (
    <SlideContainer slideId="details-topics">
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="📊"
          title="Wer redet worüber?"
          subtitle="Die Top-Parteien pro Thema"
          slideId="details-topics"
        />
      </View>

      {showBubbles &&
        displayTopics.map((topicScore, i) => {
          const topic = TOPIC_BY_ID[topicScore.topic];
          if (!topic) return null;
          return (
            <TopicBubble
              key={topicScore.topic}
              topicId={topicScore.topic}
              index={i}
              position={BUBBLE_POSITIONS.fiveItems[i]}
              partyRankings={allPartyRankings[topicScore.topic]}
              availableHeight={availableHeight}
              entranceProgress={entranceProgress}
              bubbleColor={topic.color || '#888888'}
            />
          );
        })}
    </SlideContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bubble: {
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
});
