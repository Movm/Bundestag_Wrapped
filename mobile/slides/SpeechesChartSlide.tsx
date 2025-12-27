import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { PartyStats } from '@/data/wrapped';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import {
  SlideContainer,
  bubbleAnimations,
  emojiPopEntering,
  fadeUpEntering,
  fadeInEntering,
  bouncyStaggerEntering,
} from './shared';
import { useAppStore, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useTop5Parties, useSpeechBubbleSizes, useTotalSpeeches } from '../stores/precomputedDataStore';
import { SkiaBubbles, BubbleConfig } from '../components/SkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SpeechesChartSlideProps {
  slideIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Bubble Overlay Component (text + tap handling only)
// ─────────────────────────────────────────────────────────────

interface BubbleOverlayProps {
  party: PartyStats;
  index: number;
  position: { top: number; left: number };
  bubbleSize: number;
  availableHeight: number;
}

const BubbleOverlay = React.memo(function BubbleOverlay({
  party,
  index,
  position,
  bubbleSize,
  availableHeight,
}: BubbleOverlayProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped((prev) => !prev);
  };

  return (
    <Animated.View
      entering={bouncyStaggerEntering(index, 200)}
      style={[
        styles.bubbleOverlay,
        {
          top: availableHeight * (position.top / 100),
          left: SCREEN_WIDTH * (position.left / 100),
          width: bubbleSize,
          height: bubbleSize,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={[styles.bubblePressable, { borderRadius: bubbleSize / 2 }]}
      >
        {!isFlipped ? (
          <View style={styles.bubbleContent}>
            <Text style={styles.speechCount}>
              {party.speeches.toLocaleString('de-DE')}
            </Text>
            <Text style={styles.speechLabel}>Reden</Text>
          </View>
        ) : (
          <View style={styles.bubbleBackContent}>
            <Text style={styles.partyTitle}>{party.party}</Text>
            <Text style={styles.wortCount}>
              {party.wortbeitraege.toLocaleString('de-DE')}
            </Text>
            <Text style={styles.wortLabel}>Wortbeiträge</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function SpeechesChartSlide({ slideIndex }: SpeechesChartSlideProps) {
  // Direct selector - avoids object creation that can cause re-render loops
  const availableHeight = useAppStore((s) => s.availableHeight);
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  // This allows header to appear first for faster perceived start
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Use precomputed data from store (computed once on mount, O(1) access)
  // Separate selectors prevent object creation that can cause re-render loops
  const top5 = useTop5Parties();
  const bubbleSizes = useSpeechBubbleSizes();
  const totalReden = useTotalSpeeches();

  // Create bubble configs for Skia Canvas
  const bubbleConfigs = React.useMemo<BubbleConfig[]>(() => {
    return top5.map((party, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      const size = bubbleSizes[i];
      return {
        x: SCREEN_WIDTH * (pos.left / 100) + size / 2,
        y: availableHeight * (pos.top / 100) + size / 2,
        size,
        color: getPartyColor(party.party),
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

      {/* Skia Canvas - static gradient backgrounds */}
      {showBubbles && <SkiaBubbles bubbles={bubbleConfigs} />}

      {/* Native overlays - text + tap handling */}
      {showBubbles && top5.map((party, i) => (
        <BubbleOverlay
          key={party.party}
          party={party}
          index={i}
          position={BUBBLE_POSITIONS.fiveItems[i]}
          bubbleSize={bubbleSizes[i]}
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
  bubbleOverlay: {
    position: 'absolute',
  },
  bubblePressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  speechCount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  speechLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
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
