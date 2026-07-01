import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import type { PartyStats } from '@/data/wrapped';
import {
  SlideContainer,
  emojiPopEntering,
  fadeUpEntering,
} from './shared';
import { useAppStore, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties, useSpeechBubbleSizes, useTotalWortbeitraege } from '../stores/precomputedDataStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SpeechesDetailsSlideProps {
  slideIndex: number;
}

const PHASE_OFFSET = 0.12;
const TOTAL_BUBBLES = 5;

interface PartyBubbleProps {
  party: PartyStats;
  index: number;
  position: { top: number; left: number };
  bubbleSize: number;
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  bubbleColor: string;
}

const PartyBubble = React.memo(function PartyBubble({
  party,
  index,
  position,
  bubbleSize,
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
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: bubbleSize / 2,
          backgroundColor: bubbleColor,
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.partyTitle}>{party.party}</Text>
      <Text style={styles.wortCount}>
        {party.wortbeitraege.toLocaleString('de-DE')}
      </Text>
      <Text style={styles.wortLabel}>Wortbeiträge</Text>
    </Animated.View>
  );
});

export function SpeechesDetailsSlide({ slideIndex }: SpeechesDetailsSlideProps) {
  const availableHeight = useAppStore((s) => s.availableHeight);
  const topInset = useTopInset();

  const showBubbles = useDeferredRender(slideIndex, 300);
  const entranceProgress = useSharedValue(0);

  const top5 = useTop5Parties();
  const bubbleSizes = useSpeechBubbleSizes();
  const totalWortbeitraege = useTotalWortbeitraege();

  useEffect(() => {
    if (showBubbles) {
      entranceProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [showBubbles, entranceProgress]);

  return (
    <SlideContainer slideId="details-speeches">
      <View style={[styles.header, { top: topInset + 16 }]}>
        <Animated.Text entering={emojiPopEntering(0)} style={styles.emoji}>
          💬
        </Animated.Text>
        <Animated.Text entering={fadeUpEntering(150)} style={styles.subtitle}>
          WORTBEITRÄGE
        </Animated.Text>
        <Animated.Text entering={fadeUpEntering(250)} style={styles.title}>
          {totalWortbeitraege.toLocaleString('de-DE')} Wortbeiträge
        </Animated.Text>
      </View>

      {showBubbles &&
        top5.map((party, i) => (
          <PartyBubble
            key={party.party}
            party={party}
            index={i}
            position={BUBBLE_POSITIONS.fiveItems[i]}
            bubbleSize={bubbleSizes[i]}
            availableHeight={availableHeight}
            entranceProgress={entranceProgress}
            bubbleColor={getPartyColor(party.party)}
          />
        ))}
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
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  partyTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  wortCount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  wortLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});
