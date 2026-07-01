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
import { SlideContainer, SlideHeader } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties } from '../stores/precomputedDataStore';
import type { PartyStats } from '@/data/wrapped';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VocabularyDetailsSlideProps {
  slideIndex: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);
const PHASE_OFFSET = 0.12;
const TOTAL_BUBBLES = 5;

interface PartyBubbleProps {
  party: PartyStats;
  index: number;
  position: { top: number; left: number };
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  bubbleColor: string;
}

const PartyBubble = React.memo(function PartyBubble({
  party,
  index,
  position,
  availableHeight,
  entranceProgress,
  bubbleColor,
}: PartyBubbleProps) {
  const backWords = party.signatureWords.slice(0, 5);

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
      <Text style={styles.partyTitle}>{party.party}</Text>
      <View style={styles.wordList}>
        {backWords.map((w, i) => (
          <Text
            key={w.word}
            style={[styles.wordItem, i === 0 && styles.wordItemFirst]}
            numberOfLines={1}
          >
            {w.word}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
});

export function VocabularyDetailsSlide({ slideIndex }: VocabularyDetailsSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  const showBubbles = useDeferredRender(slideIndex, 300);
  const entranceProgress = useSharedValue(0);

  const topParties = useTop5Parties();

  useEffect(() => {
    if (showBubbles) {
      entranceProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [showBubbles, entranceProgress]);

  return (
    <SlideContainer slideId="details-signature">
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="📚"
          title="Die Top-Wörter"
          subtitle="5 charakteristische Wörter pro Partei"
          slideId="details-signature"
        />
      </View>

      {showBubbles &&
        topParties.map((party, i) => (
          <PartyBubble
            key={party.party}
            party={party}
            index={i}
            position={BUBBLE_POSITIONS.fiveItems[i]}
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
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
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
  wordList: {
    alignItems: 'center',
  },
  wordItem: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14,
  },
  wordItemFirst: {
    fontSize: 12,
    fontWeight: '700',
  },
});
