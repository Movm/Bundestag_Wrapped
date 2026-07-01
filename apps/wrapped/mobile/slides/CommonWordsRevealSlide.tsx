import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import { SlideContainer, SlideHeader } from './shared';
import { useTopInset } from '../stores/appStore';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const WORD_SIZES = [40, 34, 28, 24, 20, 18];
const WORD_WEIGHTS: ('900' | '700' | '600' | '500')[] = ['900', '700', '700', '600', '600', '500'];

const WORD_COLORS = [
  '#f472b6', // pink-400
  '#f472b6', // pink-400
  '#60a5fa', // blue-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
  '#fb923c', // orange-400
  '#f87171', // red-400
  '#22d3ee', // cyan-400
];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CommonWordsRevealSlideProps {
  hotTopics: string[];
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function CommonWordsRevealSlide({ hotTopics }: CommonWordsRevealSlideProps) {
  const topInset = useTopInset();

  return (
    <SlideContainer slideId="reveal-common-words">
      {/* Header */}
      <View style={[styles.header, { top: topInset + 40 }]}>
        <SlideHeader
          emoji="📊"
          title="Häufigste Wörter"
          subtitle="Die meistgenutzten Wörter im Bundestag"
          slideId="reveal-common-words"
        />
      </View>

      {/* Word Cloud */}
      <View style={styles.wordCloud}>
        {hotTopics.map((topic, i) => {
          const sizeIndex = Math.min(i, WORD_SIZES.length - 1);
          const fontSize = WORD_SIZES[sizeIndex];
          const fontWeight = WORD_WEIGHTS[sizeIndex];
          const color = WORD_COLORS[i % WORD_COLORS.length];

          return (
            <Animated.Text
              key={topic}
              entering={ZoomIn.delay(400 + i * 80).springify()}
              style={[
                styles.word,
                {
                  fontSize,
                  fontWeight,
                  color,
                },
              ]}
            >
              {topic}
            </Animated.Text>
          );
        })}
      </View>

      {/* Note */}
      <Animated.Text entering={FadeIn.delay(1800)} style={styles.note}>
        Diese Wörter erscheinen bei mehreren{'\n'}Parteien unter den Top 50
      </Animated.Text>
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
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 360,
  },
  word: {
    paddingHorizontal: 6,
  },
  note: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 20,
  },
});
