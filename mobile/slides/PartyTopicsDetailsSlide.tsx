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
import { usePartyTopTopics } from '../stores/precomputedDataStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PartyTopicsDetailsSlideProps {
  slideIndex: number;
}

interface TopicScore {
  topic: string;
  score: number;
}

const DISPLAY_PARTIES = ['AfD', 'CDU/CSU', 'DIE LINKE', 'GRÜNE', 'SPD'];
const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.33, 150);
const PHASE_OFFSET = 0.12;
const TOTAL_BUBBLES = 5;

interface PartyBubbleProps {
  party: string;
  index: number;
  position: { top: number; left: number };
  topTopics: TopicScore[];
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  bubbleColor: string;
}

const PartyBubble = React.memo(function PartyBubble({
  index,
  position,
  topTopics,
  availableHeight,
  entranceProgress,
  bubbleColor,
}: PartyBubbleProps) {
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
  );
});

export function PartyTopicsDetailsSlide({ slideIndex }: PartyTopicsDetailsSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  const showBubbles = useDeferredRender(slideIndex, 300);
  const entranceProgress = useSharedValue(0);

  const partyTopTopics = usePartyTopTopics();

  useEffect(() => {
    if (showBubbles) {
      entranceProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [showBubbles, entranceProgress]);

  return (
    <SlideContainer slideId="details-party-topics">
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="🏛️"
          title="Die Top-Themen"
          subtitle="5 häufigste Themen pro Partei"
          slideId="details-party-topics"
        />
      </View>

      {showBubbles &&
        DISPLAY_PARTIES.map((party, i) => {
          const topTopics = partyTopTopics[party];
          if (!topTopics) return null;
          return (
            <PartyBubble
              key={party}
              party={party}
              index={i}
              position={BUBBLE_POSITIONS.fiveItems[i]}
              topTopics={topTopics}
              availableHeight={availableHeight}
              entranceProgress={entranceProgress}
              bubbleColor={getPartyBgColor(party)}
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
});
