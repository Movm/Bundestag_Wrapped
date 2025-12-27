import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { PartyProfile } from '@/data/wrapped';
import { getPartyColor, BUBBLE_POSITIONS } from '@/shared';
import { SlideContainer, SlideHeader, directionalStaggerEntering } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useSortedToneProfiles, usePartyToneSummary } from '../stores/precomputedDataStore';
import { SkiaBubbles, BubbleConfig } from '../components/SkiaBubbles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PARTY_SUMMARIES: Record<string, string> = {
  'CDU/CSU': 'Setzt auf positive Rhetorik und sucht Konsens statt Konfrontation.',
  'SPD': 'Fokussiert auf praktische Lösungen und parteiübergreifende Zusammenarbeit.',
  'GRÜNE': 'Balanciert Idealismus mit pragmatischen Ansätzen im Parlament.',
  'AfD': 'Greift scharf an, etikettiert Gegner und setzt auf Konfrontation.',
  'DIE LINKE': 'Stellt kämpferisch soziale Forderungen und hinterfragt die Regierung.',
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ToneRevealSlideProps {
  slideIndex: number;
}

// ─────────────────────────────────────────────────────────────
// Tone Bubble Overlay Component (text + tap handling only)
// ─────────────────────────────────────────────────────────────

interface ToneBubbleOverlayProps {
  profile: PartyProfile;
  index: number;
  position: { top: number; left: number };
  availableHeight: number;
}

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);

const ToneBubbleOverlay = React.memo(function ToneBubbleOverlay({
  profile,
  index,
  position,
  availableHeight,
}: ToneBubbleOverlayProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  // Use precomputed holistic summary from store (O(1) lookup)
  const holisticSummary = usePartyToneSummary(profile.party);
  const partyColor = getPartyColor(profile.party);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped((prev) => !prev);
  };

  return (
    <Animated.View
      entering={directionalStaggerEntering(index, 200)}
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
            <Text style={styles.bubbleEmoji}>{profile.emoji}</Text>
            <Text style={styles.bubbleSummary}>{holisticSummary}</Text>
          </View>
        ) : (
          <View style={styles.bubbleBackContent}>
            <Text style={[styles.partyTitle, { color: partyColor }]}>
              {profile.party}
            </Text>
            <Text style={styles.partyDescription}>
              {PARTY_SUMMARIES[profile.party] || 'Keine Beschreibung verfügbar.'}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ToneRevealSlide({ slideIndex }: ToneRevealSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  // Defer bubble rendering until 300ms after slide becomes visible
  // This allows header to appear first for faster perceived start
  const showBubbles = useDeferredRender(slideIndex, 300);

  // Use precomputed sorted profiles from store (computed once on mount)
  const sortedProfiles = useSortedToneProfiles();
  const topParties = sortedProfiles.slice(0, 5);

  // Create bubble configs for Skia Canvas
  const bubbleConfigs = React.useMemo<BubbleConfig[]>(() => {
    return topParties.map((profile, i) => {
      const pos = BUBBLE_POSITIONS.fiveItems[i];
      return {
        x: SCREEN_WIDTH * (pos.left / 100) + BUBBLE_SIZE / 2,
        y: availableHeight * (pos.top / 100) + BUBBLE_SIZE / 2,
        size: BUBBLE_SIZE,
        color: getPartyColor(profile.party),
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
          subtitle="Tippe zum Umdrehen"
        />
      </View>

      {/* Skia Canvas - static gradient backgrounds */}
      {showBubbles && (
        <SkiaBubbles bubbles={bubbleConfigs} />
      )}

      {/* Native overlays - text + tap handling */}
      {showBubbles && topParties.map((profile, i) => (
        <ToneBubbleOverlay
          key={profile.party}
          profile={profile}
          index={i}
          position={BUBBLE_POSITIONS.fiveItems[i]}
          availableHeight={availableHeight}
        />
      ))}
    </SlideContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

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
    padding: 8,
  },
  bubbleEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  bubbleSummary: {
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  partyDescription: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 4,
  },
});
