import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { BUBBLE_POSITIONS, TOPIC_BY_ID } from '@/shared';
import { SlideContainer, SlideHeader } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useDisplayTopics } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TopicsRevealSlideProps {
  slideIndex: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.33, 150);

export function TopicsRevealSlide({ slideIndex }: TopicsRevealSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Single SharedValue drives all bubble animations
  const entranceProgress = useSharedValue(0);

  // Use precomputed data from store (computed once on mount, O(1) access)
  const displayTopics = useDisplayTopics();

  // Trigger entrance animation when bubbles become visible
  useEffect(() => {
    if (showBubbles) {
      entranceProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
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

      {/* Animated Skia Canvas - circles + text animate together */}
      {showBubbles && (
        <AnimatedSkiaBubbles
          bubbles={bubbleConfigs}
          progress={entranceProgress}
          phaseOffset={0.12}
        />
      )}
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
});
