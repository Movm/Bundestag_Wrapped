import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { getPartyColor } from '@/shared';
import { SPEAKER_CONTENT } from '@/shared/speaker-wrapped';
import { shareImage } from '../../lib/share-utils';
import { SpeakerShareCanvasSkia } from '../../components/SpeakerShareCanvasSkia';
import type { SpeakerWrapped } from '~/types/wrapped';
import { SpeakerSlideContainer } from './shared';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface EndSectionProps {
  data: SpeakerWrapped;
  onRestart: () => void;
}

/**
 * EndSection - Final slide with fun facts and navigation buttons
 * Uses local Skia canvas rendering for share images
 */
export function EndSection({ data, onRestart }: EndSectionProps) {
  const router = useRouter();
  const partyColor = getPartyColor(data.party);
  const content = SPEAKER_CONTENT.end;
  const funFacts = data.funFacts.slice(0, 4);

  const [isSharing, setIsSharing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const canvasRef = useRef<View>(null);

  // Get signature word for the share image (use Bundestag comparison)
  const signatureWord = data.words.signatureWordsBundestag[0] || null;

  // Capture canvas on mount for faster sharing
  useEffect(() => {
    const captureCanvas = async () => {
      if (!canvasRef.current) return;

      // Small delay to ensure Skia canvas is rendered
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        const uri = await captureRef(canvasRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        setImageUri(uri);
      } catch (error) {
        console.error('Failed to capture speaker share image:', error);
      }
    };

    captureCanvas();
  }, [data]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      if (imageUri) {
        await shareImage(imageUri, 'Teile dein Bundestag Wrapped');
      } else {
        // Fallback: try to capture now
        if (canvasRef.current) {
          const uri = await captureRef(canvasRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
          await shareImage(uri, 'Teile dein Bundestag Wrapped');
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  }, [imageUri, isSharing]);

  return (
    <SpeakerSlideContainer>
      {/* Hidden canvas for share image capture */}
      <View style={styles.hiddenCanvas}>
        <View ref={canvasRef} collapsable={false}>
          <SpeakerShareCanvasSkia
            name={data.name}
            party={data.party}
            spiritAnimal={data.spiritAnimal}
            signatureWord={signatureWord}
          />
        </View>
      </View>

      <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.content}>
        {/* Emoji */}
        <Text style={styles.emoji}>{content.emoji}</Text>

        {/* Title */}
        <Animated.Text entering={FadeInUp.delay(200)} style={styles.title}>
          {content.title}
        </Animated.Text>

        <Animated.Text entering={FadeIn.delay(300)} style={styles.subtitle}>
          {content.subtitle}
        </Animated.Text>

        {/* Fun Facts Grid */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.funFactsCard}>
          <View style={styles.funFactsGrid}>
            {funFacts.map((fact, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.delay(500 + i * 100)}
                style={styles.funFact}
              >
                <Text style={styles.funFactEmoji}>{fact.emoji}</Text>
                <Text style={styles.funFactValue}>{fact.value}</Text>
                <Text style={styles.funFactLabel}>{fact.label}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Share Button */}
          <AnimatedPressable
            entering={FadeInUp.delay(800)}
            style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.shareButtonText}>{content.shareButton}</Text>
            )}
          </AnimatedPressable>

          {/* Restart Button */}
          <AnimatedPressable
            entering={FadeInUp.delay(900)}
            onPress={onRestart}
            style={[styles.restartButton, { backgroundColor: partyColor }]}
          >
            <Text style={styles.restartButtonText}>{content.restartButton}</Text>
          </AnimatedPressable>

          {/* Other Speakers */}
          <AnimatedPressable
            entering={FadeInUp.delay(1000)}
            onPress={() => router.push('/')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>{content.otherSpeakersButton}</Text>
          </AnimatedPressable>

          {/* Home */}
          <AnimatedPressable
            entering={FadeIn.delay(1100)}
            onPress={() => router.push('/')}
            style={styles.tertiaryButton}
          >
            <Text style={styles.tertiaryButtonText}>{content.homeButton}</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </SpeakerSlideContainer>
  );
}

const styles = StyleSheet.create({
  hiddenCanvas: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  funFactsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  funFactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  funFact: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  funFactEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  funFactValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  funFactLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ec4899',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  restartButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
  },
  restartButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  tertiaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tertiaryButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
});
