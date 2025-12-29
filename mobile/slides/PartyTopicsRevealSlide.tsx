import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { getPartyBgColor, BUBBLE_POSITIONS } from '@/shared';
import { SlideContainer, SlideHeader } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PartyTopicsRevealSlideProps {
  slideIndex: number;
}

// The 5 main parties to display
const DISPLAY_PARTIES = ['AfD', 'CDU/CSU', 'DIE LINKE', 'GRÜNE', 'SPD'];

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.33, 150);

export function PartyTopicsRevealSlide({ slideIndex }: PartyTopicsRevealSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Single SharedValue drives all bubble animations
  const entranceProgress = useSharedValue(0);

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
