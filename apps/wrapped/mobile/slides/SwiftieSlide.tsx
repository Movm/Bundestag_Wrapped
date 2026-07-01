import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  ZoomIn,
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getPartyColor, QUIZZES } from '@/shared';
import {
  SlideContainer,
  SlideQuiz,
  type QuizConfig,
  emojiPopEntering,
  fadeUpEntering,
  scaleInEntering,
  fadeInEntering,
} from './shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Constants (from shared QUIZZES)
// ─────────────────────────────────────────────────────────────

const SWIFTIE_QUIZ = QUIZZES['quiz-swiftie'];
const SWIFTIE = SWIFTIE_QUIZ.swiftie!;
const DECOYS = SWIFTIE_QUIZ.decoys!;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SlidePhase = 'intro' | 'quiz' | 'result';

interface SwiftieSlideProps {
  phase: SlidePhase;
  onQuizAnswer?: (isCorrect: boolean) => void;
  onQuizComplete?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─────────────────────────────────────────────────────────────
// Animated Heart
// ─────────────────────────────────────────────────────────────

function AnimatedHeart() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 500 }),
        withTiming(5, { duration: 500 }),
        withTiming(-5, { duration: 500 }),
        withTiming(0, { duration: 500 }),
        withTiming(0, { duration: 3000 }) // pause
      ),
      -1
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 }),
        withTiming(1, { duration: 4000 }) // pause
      ),
      -1
    );
  }, [rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.heartEmoji, animatedStyle]}>
      💜
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Result View
// ─────────────────────────────────────────────────────────────

function ResultView() {
  const partyColor = getPartyColor(SWIFTIE.party);

  return (
    <SlideContainer slideId="reveal-swiftie">
      <View style={styles.resultContent}>
        {/* Emoji */}
        <AnimatedHeart />

        {/* Title */}
        <Animated.Text entering={fadeUpEntering(100)} style={styles.resultTitle}>
          Swiftie
        </Animated.Text>
        <Animated.Text entering={fadeUpEntering(200)} style={styles.resultSubtitle}>
          im Bundestag
        </Animated.Text>

        {/* Card */}
        <Animated.View entering={scaleInEntering(300)}>
          <LinearGradient
            colors={['rgba(147, 51, 234, 0.3)', 'rgba(236, 72, 153, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.swiftieCard}
          >
            {/* Crown */}
            <Animated.Text entering={emojiPopEntering(600)} style={styles.crown}>
              👑
            </Animated.Text>

            {/* Bracelets - staggered pop */}
            <View style={styles.braceletRow}>
              <Animated.Text entering={emojiPopEntering(400)} style={styles.bracelet}>
                🩷
              </Animated.Text>
              <Animated.Text entering={emojiPopEntering(500)} style={styles.bracelet}>
                💎
              </Animated.Text>
              <Animated.Text entering={emojiPopEntering(600)} style={styles.bracelet}>
                🩵
              </Animated.Text>
            </View>

            {/* Name */}
            <Text style={[styles.swiftieName, { color: partyColor }]}>
              {SWIFTIE.name}
            </Text>

            {/* Party Badge */}
            <View style={[styles.partyBadge, { backgroundColor: partyColor }]}>
              <Text style={styles.partyBadgeText}>{SWIFTIE.party}</Text>
            </View>

            {/* Note */}
            <Text style={styles.mention}>
              Erwähnte "Taylor Swift" und "Swifties"
            </Text>
            <Text style={styles.mention}>
              in einer Rede über Cybersicherheit
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Quote */}
        <Animated.Text entering={fadeInEntering(900)} style={styles.quote}>
          "Taylor-Swift-Fans, Energiebetreiber oder auch die Polizei in
          Mecklenburg-Vorpommern, sie alle sind von Cyberangriffen betroffen."
        </Animated.Text>
      </View>
    </SlideContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function SwiftieSlide({
  phase,
  onQuizAnswer,
  onQuizComplete,
}: SwiftieSlideProps) {
  const quiz = useMemo<QuizConfig>(() => {
    const correctOption = `${SWIFTIE.name} (${SWIFTIE.party})`;
    const decoyOptions = DECOYS.map((d) => `${d.name} (${d.party})`);

    return {
      question: SWIFTIE_QUIZ.question,
      options: shuffle([correctOption, ...decoyOptions]),
      correctAnswer: correctOption,
      explanation: SWIFTIE_QUIZ.explanation,
    };
  }, []);

  if (phase === 'quiz') {
    return (
      <SlideQuiz
        quiz={quiz}
        onAnswer={onQuizAnswer ?? (() => {})}
        onComplete={onQuizComplete ?? (() => {})}
        emoji="💜"
        title="Shake it off!"
      />
    );
  }

  return <ResultView />;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heartEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  swiftieCard: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  crown: {
    position: 'absolute',
    top: -16,
    right: -8,
    fontSize: 32,
  },
  braceletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bracelet: {
    fontSize: 36,
  },
  swiftieName: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  partyBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  partyBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  mention: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  quote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});
