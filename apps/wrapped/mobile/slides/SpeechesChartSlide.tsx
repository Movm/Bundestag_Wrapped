import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import {
  SlideContainer,
  emojiPopEntering,
  fadeUpEntering,
  fadeInEntering,
} from './shared';
import { useAppStore, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties, useSpeechBubbleSizes, useTotalSpeeches } from '../stores/precomputedDataStore';
import {
  AnimatedSkiaBubbles,
  type AnimatedBubbleConfig,
} from '../components/AnimatedSkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SpeechesChartSlideProps {
  slideIndex: number;
}

export function SpeechesChartSlide({ slideIndex }: SpeechesChartSlideProps) {
  // Direct selector - avoids object creation that can cause re-render loops
  const availableHeight = useAppStore((s) => s.availableHeight);
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Single SharedValue drives all bubble animations
  const entranceProgress = useSharedValue(0);

  // Use precomputed data from store (computed once on mount, O(1) access)
  const top5 = useTop5Parties();
  const bubbleSizes = useSpeechBubbleSizes();
  const totalReden = useTotalSpeeches();

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
    return top5.map((party, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      const size = bubbleSizes[i];
      return {
        id: party.party,
        x: SCREEN_WIDTH * (pos.left / 100) + size / 2,
        y: availableHeight * (pos.top / 100) + size / 2,
        size,
        color: getPartyColor(party.party),
        frontText: party.speeches.toLocaleString('de-DE'),
        frontSubtext: 'Reden',
      };
    });
  }, [top5, bubbleSizes, availableHeight]);

  return (
    <SlideContainer slideId="chart-speeches">
      {/* Header - renders immediately */}
      <View style={[styles.header, { top: topInset + 16 }]}>
        <Animated.Text entering={emojiPopEntering(0)} style={styles.emoji}>
          🎤
        </Animated.Text>
        <Animated.Text entering={fadeUpEntering(150)} style={styles.subtitle}>
          DIE REDEN
        </Animated.Text>
        <Animated.Text entering={fadeUpEntering(250)} style={styles.title}>
          {totalReden.toLocaleString('de-DE')} formelle Reden
        </Animated.Text>
        <Animated.Text entering={fadeInEntering(500)} style={styles.note}>
          Wir unterscheiden zwischen richtigen Reden{'\n'}und weiteren Wortbeiträgen
        </Animated.Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  note: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
