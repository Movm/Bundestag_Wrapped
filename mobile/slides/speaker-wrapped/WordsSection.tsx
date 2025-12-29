import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  SPEAKER_CONTENT,
  getDisplayWords,
  getSignatureWordRatio,
} from '@/shared/speaker-wrapped';
import type { SpeakerWrapped } from '~/types/wrapped';
import { WordChip, SpeakerSlideContainer } from './shared';
import { fadeUpEntering, fadeInEntering } from '../shared';

interface WordsSectionProps {
  data: SpeakerWrapped;
}

/**
 * WordsSection - Shows top words and signature words
 */
export function WordsSection({ data }: WordsSectionProps) {
  const content = SPEAKER_CONTENT.words;
  const { topWords, signatureWords } = getDisplayWords(data.words);

  return (
    <SpeakerSlideContainer style={styles.scrollableContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Words Section */}
        <Animated.View entering={fadeUpEntering(100)} style={styles.section}>
          <Text style={styles.emoji}>{content.emoji}</Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>

          <View style={styles.chipsContainer}>
            {topWords.map((word, i) => (
              <WordChip
                key={word.word}
                word={word.word}
                count={word.count}
                delay={200 + i * 100}
              />
            ))}
          </View>
        </Animated.View>

        {/* Signature Words Section */}
        {signatureWords.length > 0 && (
          <Animated.View entering={fadeInEntering(800)} style={styles.section}>
            <Text style={styles.emoji}>{content.signatureEmoji}</Text>
            <Text style={styles.title}>{content.signatureTitle}</Text>
            <Text style={styles.subtitle}>{content.signatureSubtitle}</Text>

            <View style={styles.chipsContainer}>
              {signatureWords.map((word, i) => (
                <WordChip
                  key={word.word}
                  word={word.word}
                  count={`${getSignatureWordRatio(word).toFixed(1)}×`}
                  delay={900 + i * 100}
                  variant="signature"
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SpeakerSlideContainer>
  );
}

const styles = StyleSheet.create({
  scrollableContainer: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 40,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
