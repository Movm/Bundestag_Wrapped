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
import { Share2 } from 'lucide-react-native';
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
  // Score variant (with emoji title)
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  // Title variant ("Du bist eine:")
  const [imageUriTitle, setImageUriTitle] = useState<string | null>(null);
  const [isCapturingTitle, setIsCapturingTitle] = useState(false);
  const [isSharingTitle, setIsSharingTitle] = useState(false);

  // Refs for capturing both Skia canvases
  const canvasRef = useRef<View>(null);
  const canvasRefTitle = useRef<View>(null);

  // Debounce name input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(userName);
    }, 500);
    return () => clearTimeout(timer);
  }, [userName]);

  // Capture both canvases when name changes or on first render
  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    const captureCanvases = async () => {
      // Small delay to ensure Skia canvases are fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (cancelled) return;

      // Capture score variant
      if (canvasRef.current) {
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
          console.error('Failed to capture score share image:', error);
        } finally {
          if (!cancelled) {
            setIsCapturing(false);
          }
        }
      }

      // Capture title variant
      if (canvasRefTitle.current) {
        setIsCapturingTitle(true);
        try {
          const uri = await captureRef(canvasRefTitle, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
          if (!cancelled) {
            setImageUriTitle(uri);
          }
        } catch (error) {
          console.error('Failed to capture title share image:', error);
        } finally {
          if (!cancelled) {
            setIsCapturingTitle(false);
          }
        }
      }
    };

    captureCanvases();
    return () => {
      cancelled = true;
    };
  }, [isVisible, debouncedName, correctCount, totalQuestions]);

  // Handle share button (score variant)
  const handleShare = useCallback(async () => {
    if (!imageUri || isSharing) return;
    setIsSharing(true);
    try {
      await shareImage(imageUri, 'Teile dein Bundestag Wrapped Ergebnis');
    } finally {
      setIsSharing(false);
    }
  }, [imageUri, isSharing]);

  // Handle share button (title variant)
  const handleShareTitle = useCallback(async () => {
    if (!imageUriTitle || isSharingTitle) return;
    setIsSharingTitle(true);
    try {
      await shareImage(imageUriTitle, 'Teile dein Bundestag Wrapped Ergebnis');
    } finally {
      setIsSharingTitle(false);
    }
  }, [imageUriTitle, isSharingTitle]);

  // Handle long-press to save (score variant)
  const handleSave = useCallback(async () => {
    if (!imageUri) return;
    await saveToGallery(imageUri);
  }, [imageUri]);

  // Handle long-press to save (title variant)
  const handleSaveTitle = useCallback(async () => {
    if (!imageUriTitle) return;
    await saveToGallery(imageUriTitle);
  }, [imageUriTitle]);

  const isLoading = isCapturing || !imageUri;
  const isLoadingTitle = isCapturingTitle || !imageUriTitle;

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

        {/* Dual Image Previews - Side by side */}
        <View style={styles.dualPreviewContainer}>
          {/* Score variant (with emoji title) */}
          <Animated.View entering={scaleInEntering(500)} style={styles.previewCard}>
            <Pressable onLongPress={handleSave} delayLongPress={400} style={styles.previewContainer}>
              <View ref={canvasRef} collapsable={false} style={styles.canvasWrapper}>
                <ShareCanvasSkia
                  correctCount={correctCount}
                  totalQuestions={totalQuestions}
                  userName={debouncedName || undefined}
                  variant="score"
                />
              </View>
              {isCapturing && (
                <View style={styles.capturingOverlay}>
                  <ActivityIndicator size="small" color="#ec4899" />
                </View>
              )}
            </Pressable>
            <AnimatedPressable
              entering={snappyEntering(600)}
              style={[styles.shareButtonSmall, (isSharing || isLoading) && styles.buttonDisabled]}
              onPress={handleShare}
              disabled={isSharing || isLoading}
            >
              {isSharing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Share2 size={16} color="#ffffff" />
                  <Text style={styles.buttonTextSmall}>Teilen</Text>
                </>
              )}
            </AnimatedPressable>
          </Animated.View>

          {/* Title variant ("Du bist eine:") */}
          <Animated.View entering={scaleInEntering(550)} style={styles.previewCard}>
            <Pressable onLongPress={handleSaveTitle} delayLongPress={400} style={styles.previewContainer}>
              <View ref={canvasRefTitle} collapsable={false} style={styles.canvasWrapper}>
                <ShareCanvasSkia
                  correctCount={correctCount}
                  totalQuestions={totalQuestions}
                  userName={debouncedName || undefined}
                  variant="title"
                />
              </View>
              {isCapturingTitle && (
                <View style={styles.capturingOverlay}>
                  <ActivityIndicator size="small" color="#ec4899" />
                </View>
              )}
            </Pressable>
            <AnimatedPressable
              entering={snappyEntering(650)}
              style={[styles.shareButtonSmall, (isSharingTitle || isLoadingTitle) && styles.buttonDisabled]}
              onPress={handleShareTitle}
              disabled={isSharingTitle || isLoadingTitle}
            >
              {isSharingTitle ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Share2 size={16} color="#ffffff" />
                  <Text style={styles.buttonTextSmall}>Teilen</Text>
                </>
              )}
            </AnimatedPressable>
          </Animated.View>
        </View>
      </View>
    </SlideContainer>
  );
});

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

// Smaller preview for side-by-side layout
const PREVIEW_SIZE = Math.min(150, SHARE_CANVAS_SIZE);
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
  dualPreviewContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  previewCard: {
    alignItems: 'center',
    gap: 10,
  },
  previewContainer: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: 12,
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
  shareButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#ec4899',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextSmall: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
