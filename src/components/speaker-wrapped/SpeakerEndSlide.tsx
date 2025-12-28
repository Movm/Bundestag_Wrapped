import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { SlideContainer } from '@/components/slides/shared/SlideContainer';
import { itemVariants } from '@/components/slides/shared/animations';
import { getPartyColor } from './party-colors';
import { SpeakerShareModal } from '@/components/ui/SpeakerShareModal';

interface SpeakerEndSlideProps {
  speaker: SpeakerWrapped;
  onRestart?: () => void;
}

/**
 * Speaker Wrapped end slide.
 * Shows fun facts summary and navigation options.
 */
export function SpeakerEndSlide({ speaker, onRestart }: SpeakerEndSlideProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const partyColor = getPartyColor(speaker.party);

  const sigWord = speaker.words.signatureWordsBundestag[0];
  const shareData = {
    name: speaker.name,
    party: speaker.party,
    spiritAnimal: speaker.spiritAnimal ? {
      emoji: speaker.spiritAnimal.emoji,
      name: speaker.spiritAnimal.name,
      title: speaker.spiritAnimal.title,
      reason: speaker.spiritAnimal.reason,
    } : null,
    signatureWord: sigWord ? {
      word: sigWord.word,
      count: sigWord.count,
      ratio: sigWord.ratio,
    } : null,
  };

  return (
    <SlideContainer sparkles={{ color: 'rgba(251, 191, 36, 0.5)' }}>
      <motion.div
        variants={itemVariants}
        className="text-center max-w-md w-full"
      >
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Das war's!
        </h2>
        <p className="text-white/60 mb-8">
          Dein Bundestag Wrapped 2025
        </p>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="grid grid-cols-2 gap-4">
            {speaker.funFacts.slice(0, 4).map((fact, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl mb-1">{fact.emoji}</div>
                <div className="text-white font-semibold">{fact.value}</div>
                <div className="text-white/50 text-xs">{fact.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          <motion.button
            onClick={() => setShowShareModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-400 rounded-xl text-white font-bold"
          >
            Ergebnis teilen
          </motion.button>
          <motion.button
            onClick={onRestart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-colors"
            style={{ backgroundColor: partyColor }}
          >
            🔄 Nochmal ansehen
          </motion.button>
          <Link
            to="/abgeordnete"
            className="block w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-center rounded-xl transition-colors"
          >
            Andere Abgeordnete ansehen
          </Link>
          <Link
            to="/"
            className="block w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 text-center rounded-xl transition-colors"
          >
            Zum Haupt-Wrapped
          </Link>
        </div>
      </motion.div>

      <SpeakerShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={shareData}
      />
    </SlideContainer>
  );
}
