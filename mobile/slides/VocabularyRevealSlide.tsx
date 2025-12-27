import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { PartyStats } from '@/data/wrapped';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import {
  SlideContainer,
  SlideHeader,
  bubbleAnimations,
  rotateInStaggerEntering,
} from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties } from '../stores/precomputedDataStore';
import { SkiaBubbles, BubbleConfig } from '../components/SkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface VocabularyRevealSlideProps {
  slideIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Party Bubble Overlay Component (text + tap handling only)
// ─────────────────────────────────────────────────────────────

interface PartyBubbleOverlayProps {
  party: PartyStats;
  index: number;
  position: { top: number; left: number };
  availableHeight: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);

const PartyBubbleOverlay = React.memo(function PartyBubbleOverlay({
  party,
  index,
  position,
  availableHeight,
}: PartyBubbleOverlayProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped((prev) => !prev);
  };

  const signatureWord = party.signatureWords[0];
  const backWords = party.signatureWords.slice(0, 5);

  return (
    <Animated.View
      entering={rotateInStaggerEntering(index, 200)}
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
            <Text style={styles.signatureWord}>{signatureWord?.word ?? '–'}</Text>
          </View>
        ) : (
          <View style={styles.bubbleBackContent}>
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
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function VocabularyRevealSlide({ slideIndex }: VocabularyRevealSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  // This allows header to appear first for faster perceived start
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Use precomputed top 5 parties from store (computed once on mount)
  const topParties = useTop5Parties();

  // Create bubble configs for Skia Canvas
  const bubbleConfigs = React.useMemo<BubbleConfig[]>(() => {
    return topParties.map((party, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      return {
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: getPartyColor(party.party),
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
        />
      </View>

      {/* Skia Canvas - static gradient backgrounds */}
      {showBubbles && (
        <SkiaBubbles bubbles={bubbleConfigs} />
      )}

      {/* Native overlays - text + tap handling */}
      {showBubbles && topParties.map((party, i) => (
        <PartyBubbleOverlay
          key={party.party}
          party={party}
          index={i}
          position={BUBBLE_POSITIONS.fiveItems[i]}
          availableHeight={availableHeight}
        />
      ))}

      {/* Hint - deferred with bubbles */}
      {showBubbles && (
        <Animated.Text entering={bubbleAnimations.hint()} style={styles.hint}>
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
    padding: 12,
  },
  signatureWord: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bubbleBackContent: {
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
