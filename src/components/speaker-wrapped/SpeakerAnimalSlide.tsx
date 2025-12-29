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
  rank: 2 | 3;
  delay: number;
}

function AlternativeAnimal({ animal, rank, delay }: AlternativeAnimalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative">
        <div className="absolute -top-2 -right-2 w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-white/20 flex items-center justify-center text-xs lg:text-sm font-bold text-white">
          {rank}
        </div>
        <div className="text-5xl sm:text-6xl lg:text-6xl mb-2">{animal.emoji}</div>
      </div>
      <p className="text-white/80 font-semibold text-sm lg:text-base">{animal.name}</p>
      <p className="text-white/50 text-xs lg:text-sm mt-1 max-w-[140px] lg:max-w-[120px]">{animal.title}</p>
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

        {/* Podium Layout - Column on mobile, row on desktop */}
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end lg:justify-center lg:gap-10 mb-6">

          {/* Primary Animal (1st place) - First in DOM for mobile, center on desktop */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            whileInView={{ scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center relative z-10 lg:order-2"
          >
            <div className="relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-yellow-400/90 flex items-center justify-center text-sm lg:text-base font-bold text-yellow-900 shadow-lg">
                1
              </div>
              <div className="text-7xl sm:text-8xl lg:text-9xl mb-3">{spiritAnimal.emoji}</div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2"
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
              <span className="text-white font-semibold text-sm sm:text-base">{spiritAnimal.title}</span>
            </motion.div>
          </motion.div>

          {/* Alternatives - Grid on mobile, split to sides on desktop */}
          {alternatives.length > 0 && (
            <div className="grid grid-cols-2 gap-8 sm:gap-12 w-full max-w-sm lg:contents">
              {/* 2nd place - left on desktop */}
              {alternatives[0] && (
                <div className="flex justify-center lg:order-1 lg:w-32 lg:flex-shrink-0">
                  <AlternativeAnimal
                    animal={alternatives[0]}
                    rank={2}
                    delay={1.0}
                  />
                </div>
              )}

              {/* 3rd place - right on desktop */}
              {alternatives[1] && (
                <div className="flex justify-center lg:order-3 lg:w-32 lg:flex-shrink-0">
                  <AlternativeAnimal
                    animal={alternatives[1]}
                    rank={3}
                    delay={1.2}
                  />
                </div>
              )}
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
