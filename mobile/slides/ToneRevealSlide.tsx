import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
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

interface ToneRevealSlideProps {
  slideIndex: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);

export function ToneRevealSlide({ slideIndex }: ToneRevealSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Single SharedValue drives all bubble animations
  const entranceProgress = useSharedValue(0);

  // Use precomputed sorted profiles from store (computed once on mount)
  const sortedProfiles = useSortedToneProfiles();
  const topParties = sortedProfiles.slice(0, 5);

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
    return topParties.map((profile, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      return {
        id: profile.party,
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: getPartyColor(profile.party),
        emoji: profile.emoji,
        frontText: '',
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
          subtitle="Wie kommunizieren die Parteien?"
          slideId="reveal-tone"
        />
      </View>

      {/* Animated Skia Canvas - circles + emoji animate together */}
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
});
