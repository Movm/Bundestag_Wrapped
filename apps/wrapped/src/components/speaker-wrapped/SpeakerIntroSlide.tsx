import { motion } from 'motion/react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { SlideContainer } from '@/components/slides/shared/SlideContainer';
import { itemVariants } from '@/components/slides/shared/animations';
import { getPartyColor, PARTY_BG_CLASSES } from './party-colors';
import { playSound } from '@/lib/sounds';
import { displaySpeakerName } from '@/lib/speaker-profile-utils';

interface SpeakerIntroSlideProps {
  speaker: SpeakerWrapped;
  onStart?: () => void;
}

/**
 * Speaker Wrapped intro slide.
 * Shows speaker name, party badge, and start button.
 * Button unlocks scroll to next slide.
 */
export function SpeakerIntroSlide({ speaker, onStart }: SpeakerIntroSlideProps) {
  const partyColor = getPartyColor(speaker.party);

  const handleStart = () => {
    playSound('click');
    onStart?.();
  };

  return (
    <SlideContainer sparkles>
      {/* Header section */}
      <motion.div variants={itemVariants} className="text-center">
        <span className="text-6xl mb-6 block">🏛️</span>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
          {displaySpeakerName(speaker)}
        </h1>
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium text-white mb-4 ${
            PARTY_BG_CLASSES[speaker.party] || 'bg-gray-500'
          }`}
        >
          {speaker.party}
        </span>
        <p className="text-white/60 text-lg mb-8">Dein Bundestag Wrapped 2025</p>
      </motion.div>

      {/* Start button */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <button
          onClick={handleStart}
          className="px-8 py-4 text-lg font-semibold rounded-2xl text-white transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: partyColor }}
        >
          Los geht's
        </button>
      </motion.div>
    </SlideContainer>
  );
}
