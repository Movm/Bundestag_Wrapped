import { motion } from 'motion/react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { SlideContainer } from '@/components/slides/shared/SlideContainer';
import { itemVariants } from '@/components/slides/shared/animations';

interface SpeakerWordsSlideProps {
  speaker: SpeakerWrapped;
}

/**
 * Speaker Wrapped words slide.
 * Shows favorite words and signature words.
 */
export function SpeakerWordsSlide({ speaker }: SpeakerWordsSlideProps) {
  const topWords = speaker.words.topWords.slice(0, 6);
  // Use Bundestag comparison - shows what makes this speaker unique nationally
  const signatureWords = speaker.words.signatureWordsBundestag || [];

  return (
    <SlideContainer sparkles={{ color: 'rgba(94, 234, 212, 0.5)' }}>
      <motion.div
        variants={itemVariants}
        className="w-full max-w-4xl flex flex-col lg:flex-row lg:items-start lg:gap-12"
      >
        {/* Left: Lieblingswörter */}
        <div className="flex-1 text-center lg:text-left mb-8 lg:mb-0">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-white mb-2">Deine Lieblingswörter</h2>
          <p className="text-white/60 mb-6">Die häufigsten Begriffe in deinen Reden</p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            {topWords.map((word, i) => (
              <motion.div
                key={word.word}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1, type: 'spring' }}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-full"
              >
                <span className="text-white font-medium">{word.word}</span>
                <span className="text-white/40 ml-2 text-sm">{word.count}×</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Signature Words */}
        {signatureWords.length > 0 && (
          <div className="flex-1 text-center lg:text-left">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-white mb-2">Deine Signature Words</h2>
            <p className="text-white/60 mb-6">
              Wörter die du häufiger nutzt als der Bundestag-Durchschnitt
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {signatureWords.map((word, i) => (
                <motion.div
                  key={word.word}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-full"
                >
                  <span className="text-white font-medium">{word.word}</span>
                  <span className="text-white/40 ml-2 text-sm">
                    {word.ratio.toFixed(1)}×
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </SlideContainer>
  );
}
