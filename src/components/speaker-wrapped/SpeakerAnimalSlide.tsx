import { motion } from 'motion/react';
import type { SpeakerWrapped, SpiritAnimalAlternative } from '@/data/speaker-wrapped';
import { SlideContainer } from '@/components/slides/shared/SlideContainer';
import { itemVariants } from '@/components/slides/shared/animations';
import { getPartyColor } from './party-colors';

interface SpeakerAnimalSlideProps {
  speaker: SpeakerWrapped;
}

interface AlternativeAnimalProps {
  animal: SpiritAnimalAlternative;
  position: 'left' | 'right';
  delay: number;
}

function AlternativeAnimal({ animal, position, delay }: AlternativeAnimalProps) {
  const isLeft = position === 'left';

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30, y: 20 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative">
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
          {isLeft ? '2' : '3'}
        </div>
        <div className="text-5xl md:text-6xl mb-2">{animal.emoji}</div>
      </div>
      <p className="text-white/80 font-semibold text-sm md:text-base">{animal.name}</p>
      <p className="text-white/50 text-xs mt-1 max-w-[120px]">{animal.title}</p>
    </motion.div>
  );
}

/**
 * Speaker Wrapped animal slide.
 * Shows spirit animal on a podium with alternatives.
 * Content auto-scrolls (no button needed).
 */
export function SpeakerAnimalSlide({ speaker }: SpeakerAnimalSlideProps) {
  const partyColor = getPartyColor(speaker.party);
  const { spiritAnimal } = speaker;

  // Skip if no spirit animal data
  if (!spiritAnimal) {
    return null;
  }

  const alternatives = spiritAnimal.alternatives ?? [];

  return (
    <SlideContainer sparkles={{ color: 'rgba(244, 114, 182, 0.6)' }}>
      <motion.div variants={itemVariants} className="text-center w-full max-w-2xl mx-auto">
        <p className="text-white/60 text-lg mb-6">
          Dein Bundestag-Tier ist...
        </p>

        {/* Podium Layout */}
        <div className="relative flex items-end justify-center gap-4 md:gap-8 mb-6">
          {/* Left Alternative (2nd place) */}
          {alternatives[0] && (
            <div className="flex-shrink-0 w-24 md:w-32">
              <AlternativeAnimal
                animal={alternatives[0]}
                position="left"
                delay={1.0}
              />
            </div>
          )}

          {/* Primary Animal (1st place - elevated) */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            whileInView={{ scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center relative z-10"
          >
            <div className="relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-yellow-400/90 flex items-center justify-center text-sm font-bold text-yellow-900 shadow-lg">
                1
              </div>
              <div className="text-8xl md:text-9xl mb-3">{spiritAnimal.emoji}</div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-3xl md:text-4xl font-black text-white mb-2"
            >
              {spiritAnimal.name}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="inline-block px-4 py-2 rounded-full"
              style={{ backgroundColor: `${partyColor}40` }}
            >
              <span className="text-white font-semibold">{spiritAnimal.title}</span>
            </motion.div>
          </motion.div>

          {/* Right Alternative (3rd place) */}
          {alternatives[1] && (
            <div className="flex-shrink-0 w-24 md:w-32">
              <AlternativeAnimal
                animal={alternatives[1]}
                position="right"
                delay={1.2}
              />
            </div>
          )}
        </div>

        {/* Reason for primary animal */}
        <motion.p
          variants={itemVariants}
          className="text-white/70 text-lg leading-relaxed max-w-md mx-auto"
        >
          {spiritAnimal.reason}
        </motion.p>
      </motion.div>
    </SlideContainer>
  );
}
