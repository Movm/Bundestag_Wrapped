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
import type { PartyProfile } from '@/data/wrapped';
import { SlideContainer, SlideHeader } from './shared';
import { useAvailableHeight, useTopInset } from '../stores/appStore';
import { useDeferredRender } from '../hooks/useDeferredRender';
import { useSortedToneProfiles } from '../stores/precomputedDataStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToneDetailsSlideProps {
  slideIndex: number;
}

const PARTY_SUMMARIES: Record<string, string> = {
  'CDU/CSU': 'Setzt auf positive Rhetorik und sucht Konsens statt Konfrontation.',
  'SPD': 'Fokussiert auf praktische Lösungen und parteiübergreifende Zusammenarbeit.',
  'GRÜNE': 'Balanciert Idealismus mit pragmatischen Ansätzen im Parlament.',
  'AfD': 'Greift scharf an, etikettiert Gegner und setzt auf Konfrontation.',
  'DIE LINKE': 'Stellt kämpferisch soziale Forderungen und hinterfragt die Regierung.',
};

const BUBBLE_SIZE = Math.min(SCREEN_WIDTH * 0.35, 160);
const PHASE_OFFSET = 0.12;
const TOTAL_BUBBLES = 5;

interface ToneBubbleProps {
  profile: PartyProfile;
  index: number;
  position: { top: number; left: number };
  availableHeight: number;
  entranceProgress: SharedValue<number>;
  bubbleColor: string;
}

const ToneBubble = React.memo(function ToneBubble({
  profile,
  index,
  position,
  availableHeight,
  entranceProgress,
  bubbleColor,
}: ToneBubbleProps) {
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
      <Text style={styles.partyTitle}>{profile.party}</Text>
      <Text style={styles.partyDescription}>
        {PARTY_SUMMARIES[profile.party] || 'Keine Beschreibung verfügbar.'}
      </Text>
    </Animated.View>
  );
});

export function ToneDetailsSlide({ slideIndex }: ToneDetailsSlideProps) {
  const availableHeight = useAvailableHeight();
  const topInset = useTopInset();

  const showBubbles = useDeferredRender(slideIndex, 300);
  const entranceProgress = useSharedValue(0);

  const sortedProfiles = useSortedToneProfiles();
  const topParties = sortedProfiles.slice(0, 5);

  useEffect(() => {
    if (showBubbles) {
      entranceProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [showBubbles, entranceProgress]);

  if (topParties.length === 0) {
    return (
      <SlideContainer slideId="details-tone">
        <Text style={styles.noData}>Keine Daten verfügbar</Text>
      </SlideContainer>
    );
  }

  return (
    <SlideContainer slideId="details-tone">
      <View style={[styles.header, { top: topInset + 16 }]}>
        <SlideHeader
          emoji="🎭"
          title="Kommunikations-Stile"
          subtitle="So treten die Parteien auf"
          slideId="details-tone"
        />
      </View>

      {showBubbles &&
        topParties.map((profile, i) => (
          <ToneBubble
            key={profile.party}
            profile={profile}
            index={i}
            position={BUBBLE_POSITIONS.fiveItems[i]}
            availableHeight={availableHeight}
            entranceProgress={entranceProgress}
            bubbleColor={getPartyColor(profile.party)}
          />
        ))}
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
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  partyTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
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
