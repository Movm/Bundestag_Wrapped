import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { getPartyColor } from '@/shared';
import { SPEAKER_CONTENT, getAnimalAlternatives } from '@/shared/speaker-wrapped';
import { useScreenWidth, useScreenHeight } from '~/stores/appStore';
import type { SpeakerWrapped, SpiritAnimalAlternative } from '~/types/wrapped';

interface AnimalSectionProps {
  data: SpeakerWrapped;
}

interface AlternativeAnimalProps {
  animal: SpiritAnimalAlternative;
  position: 'left' | 'right';
  rank: number;
  delay: number;
  scale: number;
  isColumn?: boolean;
}

function AlternativeAnimal({ animal, position, rank, delay, scale, isColumn }: AlternativeAnimalProps) {
  // Use vertical animation in column mode, horizontal in row mode
  const entering = isColumn
    ? FadeInUp.delay(delay).springify()
    : position === 'left'
      ? SlideInLeft.delay(delay).springify()
      : SlideInRight.delay(delay).springify();

  return (
    <Animated.View entering={entering} style={[styles.altAnimal, { width: 90 * scale }]}>
      <View style={styles.altRankBadge}>
        <Text style={styles.altRankText}>{rank}</Text>
      </View>
      <Text style={[styles.altEmoji, { fontSize: Math.max(44 * scale, 36) }]}>{animal.emoji}</Text>
      <Text style={[styles.altName, { fontSize: Math.max(13 * scale, 11) }]}>{animal.name}</Text>
      <Text style={[styles.altTitle, { fontSize: Math.max(10 * scale, 9) }]} numberOfLines={2}>{animal.title}</Text>
    </Animated.View>
  );
}

/**
 * AnimalSection - Shows spirit animal podium (1st, 2nd, 3rd)
 */
export function AnimalSection({ data }: AnimalSectionProps) {
  const screenWidth = useScreenWidth();
  const screenHeight = useScreenHeight();

  // iPhone SE 2nd/3rd gen is exactly 375pt - use < 380 to include it
  // Matches breakpoint used in app/index.tsx for consistency
  const isSmallScreen = screenWidth < 380;

  // Responsive scale: podium needs ~320px, scale down on narrower screens
  const scale = Math.min((screenWidth - 32) / 320, 1);

  const partyColor = getPartyColor(data.party);
  const content = SPEAKER_CONTENT.animal;
  const { spiritAnimal } = data;

  if (!spiritAnimal) {
    return null;
  }

  const alternatives = getAnimalAlternatives(spiritAnimal);

  return (
    <View style={[styles.container, { height: screenHeight }]}>
      <View style={styles.content}>
        {/* Subtitle */}
        <Animated.Text entering={FadeIn.delay(100)} style={styles.subtitle}>
          {content.subtitle}
        </Animated.Text>

        {/* Podium Layout */}
        <View style={[
          styles.podium,
          isSmallScreen && styles.podiumColumn,
          { gap: isSmallScreen ? 12 : Math.max(10 * scale, 6) }
        ]}>
          {/* Row mode: 2nd, 1st, 3rd | Column mode: 1st, 2nd, 3rd */}
          {!isSmallScreen && alternatives[0] && (
            <AlternativeAnimal
              animal={alternatives[0]}
              position="left"
              rank={2}
              delay={1000}
              scale={scale}
            />
          )}

          {/* 1st Place (Primary) */}
          <Animated.View
            entering={ZoomIn.delay(300).springify().stiffness(200)}
            style={styles.primaryAnimal}
          >
            <View style={styles.primaryRankBadge}>
              <Text style={styles.primaryRankText}>1</Text>
            </View>
            <Text style={[styles.primaryEmoji, { fontSize: isSmallScreen ? 56 : Math.max(80 * scale, 64) }]}>
              {spiritAnimal.emoji}
            </Text>

            <Animated.Text
              entering={FadeInUp.delay(500).springify()}
              style={[styles.primaryName, { fontSize: isSmallScreen ? 20 : Math.max(24 * scale, 20) }]}
            >
              {spiritAnimal.name}
            </Animated.Text>

            <Animated.View
              entering={FadeIn.delay(700)}
              style={[styles.primaryTitleBadge, { backgroundColor: `${partyColor}40` }]}
            >
              <Text style={[styles.primaryTitleText, { fontSize: Math.max(13 * scale, 11) }]}>
                {spiritAnimal.title}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* 2nd Place - in column mode, render after 1st */}
          {isSmallScreen && alternatives[0] && (
            <AlternativeAnimal
              animal={alternatives[0]}
              position="left"
              rank={2}
              delay={800}
              scale={scale}
              isColumn
            />
          )}

          {/* 3rd Place */}
          {alternatives[1] && (
            <AlternativeAnimal
              animal={alternatives[1]}
              position="right"
              rank={3}
              delay={isSmallScreen ? 1000 : 1200}
              scale={scale}
              isColumn={isSmallScreen}
            />
          )}
        </View>

        {/* Reason */}
        <Animated.Text
          entering={FadeIn.delay(900)}
          style={styles.reason}
        >
          {spiritAnimal.reason}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 100,
    backgroundColor: '#0a0a0a',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  podiumColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  // Primary Animal (1st place)
  primaryAnimal: {
    alignItems: 'center',
    position: 'relative',
  },
  primaryRankBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  primaryRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854d0e',
  },
  primaryEmoji: {
    fontSize: 96,
    marginBottom: 12,
  },
  primaryName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  primaryTitleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  primaryTitleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Alternative Animals (2nd/3rd place)
  altAnimal: {
    alignItems: 'center',
    width: 100,
    position: 'relative',
  },
  altRankBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  altRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  altEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  altName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  altTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 4,
  },
  reason: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
});
