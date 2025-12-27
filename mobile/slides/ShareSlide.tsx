/**
 * ShareSlide - Quiz result sharing screen with confetti animation
 * Uses local Skia canvas rendering instead of server-side OG images
 */

import { useState, useCallback, useEffect, useMemo, memo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { useSlideVisible } from '../stores/slideStore';
import { useCorrectCount } from '../stores/quizStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, Share2 } from 'lucide-react-native';
import {
  SlideContainer,
  emojiPopEntering,
  fadeUpEntering,
  fadeInEntering,
  snappyEntering,
  scaleInEntering,
} from './shared';
import { shareImage, saveToGallery } from '../lib/share-utils';
import { ShareCanvasSkia, SHARE_CANVAS_SIZE } from '../components/ShareCanvasSkia';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// German flag colors for confetti
const CONFETTI_COLORS = ['#000000', '#DD0000', '#FFCC00'];

interface ShareSlideProps {
  slideIndex: number;
  totalQuestions: number;
}

// ─────────────────────────────────────────────────────────────
// Confetti Particle Component
// ─────────────────────────────────────────────────────────────

interface ConfettiParticleProps {
  left: number;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
  isVisible: boolean;
}

const ConfettiParticle = memo(function ConfettiParticle({
  left,
  color,
  duration,
  delay,
  rotation,
  isVisible,
}: ConfettiParticleProps) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!isVisible) {
      // Pause animations when slide is off-screen
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(rotate);
      // Reset to initial state
      translateY.value = -20;
      opacity.value = 0;
      rotate.value = 0;
      return;
    }

    // Start animation after delay when visible
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 0 }),
          withTiming(SCREEN_HEIGHT + 20, {
            duration: duration,
            easing: Easing.linear,
          })
        ),
        -1, // infinite
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: duration * 0.1 }),
          withTiming(1, { duration: duration * 0.7 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1,
        false
      )
    );

    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(rotation, { duration: duration, easing: Easing.linear })
        ),
        -1,
        false
      )
    );
  }, [isVisible, delay, duration, rotation, translateY, opacity, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        { left: `${left}%`, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
});

// ─────────────────────────────────────────────────────────────
// Falling Confetti Container
// ─────────────────────────────────────────────────────────────

interface FallingConfettiProps {
  slideIndex: number;
}

const FallingConfetti = memo(function FallingConfetti({ slideIndex }: FallingConfettiProps) {
  const isVisible = useSlideVisible(slideIndex);

  // Reduced from 30 to 15 particles for better performance
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * 3)],
        rotation: Math.random() * 720 - 360,
        duration: (Math.random() * 3 + 2) * 1000, // 2-5 seconds in ms
        delay: Math.random() * 3000, // 0-3 seconds delay
      })),
    []
  );

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle
          key={p.id}
          left={p.left}
          color={p.color}
          duration={p.duration}
          delay={p.delay}
          rotation={p.rotation}
          isVisible={isVisible}
        />
      ))}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main ShareSlide Component
// ─────────────────────────────────────────────────────────────

export const ShareSlide = memo(function ShareSlide({
  slideIndex,
  totalQuestions,
}: ShareSlideProps) {
  const isVisible = useSlideVisible(slideIndex);
  // Get correct count from quiz store - only ShareSlide subscribes
  const correctCount = useCorrectCount();
  const [userName, setUserName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ref for capturing the Skia canvas
  const canvasRef = useRef<View>(null);

  // Debounce name input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(userName);
    }, 500);
    return () => clearTimeout(timer);
  }, [userName]);

  // Capture the canvas when name changes or on first render
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    let cancelled = false;

    const captureCanvas = async () => {
      // Small delay to ensure Skia canvas is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (cancelled || !canvasRef.current) return;

      setIsCapturing(true);
      try {
        const uri = await captureRef(canvasRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        if (!cancelled) {
          setImageUri(uri);
        }
      } catch (error) {
        console.error('Failed to capture share image:', error);
      } finally {
        if (!cancelled) {
          setIsCapturing(false);
        }
      }
    };

    captureCanvas();
    return () => {
      cancelled = true;
    };
  }, [isVisible, debouncedName, correctCount, totalQuestions]);

  // Handle share button
  const handleShare = useCallback(async () => {
    if (!imageUri || isSharing) return;
    setIsSharing(true);
    try {
      await shareImage(imageUri, 'Teile dein Bundestag Wrapped Ergebnis');
    } finally {
      setIsSharing(false);
    }
  }, [imageUri, isSharing]);

  // Handle download/save button
  const handleSave = useCallback(async () => {
    if (!imageUri || isSaving) return;
    setIsSaving(true);
    try {
      await saveToGallery(imageUri);
    } finally {
      setIsSaving(false);
    }
  }, [imageUri, isSaving]);

  const isLoading = isCapturing || !imageUri;

  return (
    <SlideContainer slideId="share">
      <FallingConfetti slideIndex={slideIndex} />

      <View style={styles.content}>
        {/* Header */}
        <Animated.Text entering={emojiPopEntering(100)} style={styles.emoji}>
          📸
        </Animated.Text>

        <Animated.View entering={fadeUpEntering(200)}>
          <LinearGradient
            colors={['#ec4899', '#db2777', '#be185d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleGradient}
          >
            <Text style={styles.title}>Teile dein Ergebnis!</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.Text entering={fadeInEntering(300)} style={styles.subtitle}>
          Erstelle dein persönliches Sharepic
        </Animated.Text>

        {/* Name Input */}
        <Animated.View entering={fadeUpEntering(400)} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="Dein Name (optional)"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            maxLength={30}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </Animated.View>

        {/* Image Preview - Skia canvas with view capture */}
        <Animated.View entering={scaleInEntering(500)} style={styles.previewContainer}>
          <View ref={canvasRef} collapsable={false} style={styles.canvasWrapper}>
            <ShareCanvasSkia
              correctCount={correctCount}
              totalQuestions={totalQuestions}
              userName={debouncedName || undefined}
            />
          </View>
          {isCapturing && (
            <View style={styles.capturingOverlay}>
              <ActivityIndicator size="small" color="#ec4899" />
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Save Button */}
          <AnimatedPressable
            entering={snappyEntering(600)}
            style={[styles.saveButton, (isSaving || isLoading) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Download size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Speichern</Text>
              </>
            )}
          </AnimatedPressable>

          {/* Share Button */}
          <AnimatedPressable
            entering={snappyEntering(700)}
            style={[styles.shareButton, (isSharing || isLoading) && styles.buttonDisabled]}
            onPress={handleShare}
            disabled={isSharing || isLoading}
          >
            {isSharing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Share2 size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Teilen</Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      </View>
    </SlideContainer>
  );
});

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const PREVIEW_SIZE = Math.min(280, SHARE_CANVAS_SIZE);
const SCALE = PREVIEW_SIZE / SHARE_CANVAS_SIZE;

const styles = StyleSheet.create({
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  titleGradient: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
  },
  previewContainer: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  canvasWrapper: {
    width: SHARE_CANVAS_SIZE,
    height: SHARE_CANVAS_SIZE,
    transform: [{ scale: SCALE }],
    transformOrigin: 'top left',
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ec4899',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
