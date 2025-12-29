import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import { SlideContainer, SlideHeader } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VocabularyRevealSlideProps {
  slideIndex: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);

export function VocabularyRevealSlide({ slideIndex }: VocabularyRevealSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Single SharedValue drives all bubble animations
  const entranceProgress = useSharedValue(0);

  // Use precomputed top 5 parties from store (computed once on mount)
  const topParties = useTop5Parties();

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

      {/* Animated Skia Canvas - circles + text animate together */}
      {showBubbles && (
        <AnimatedSkiaBubbles
          bubbles={bubbleConfigs}
          progress={entranceProgress}
          phaseOffset={0.12}
          fontSize={16}
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
