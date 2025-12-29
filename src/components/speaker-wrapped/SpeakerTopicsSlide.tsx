import { motion } from 'motion/react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { SlideContainer } from '@/components/slides/shared/SlideContainer';
import { itemVariants } from '@/components/slides/shared/animations';
import { getPartyColor } from './party-colors';
import { TOPIC_BY_ID } from '@/components/slides/TopicsSlide/constants';

interface SpeakerTopicsSlideProps {
  speaker: SpeakerWrapped;
}

/**
 * Speaker Wrapped topics slide.
 * Shows top topics with bubble visualization.
 */
export function SpeakerTopicsSlide({ speaker }: SpeakerTopicsSlideProps) {
  const partyColor = getPartyColor(speaker.party);
  const { topics } = speaker;

  // Skip if no topics data
  if (!topics || topics.topTopics.length === 0) {
    return null;
  }

  const topTopics = topics.topTopics.slice(0, 5);
  const primaryTopic = topTopics[0];
  const primaryMeta = TOPIC_BY_ID[primaryTopic.topic];
  const topicWords = topics.topicWords[primaryTopic.topic] || [];

  return (
    <SlideContainer sparkles={{ color: 'rgba(96, 165, 250, 0.5)' }}>
      <motion.div variants={itemVariants} className="text-center w-full max-w-2xl">
        <p className="text-white/60 text-base sm:text-lg mb-2">
          Deine Top-Themen
        </p>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 sm:mb-8">
          Worüber du am meisten sprichst
        </h2>

        {/* Topic Bubbles */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-8">
          {topTopics.map((topicScore, i) => {
            const meta = TOPIC_BY_ID[topicScore.topic];
            if (!meta) return null;

            const isPrimary = i === 0;
            const size = isPrimary
              ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32'
              : 'w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-24 md:h-24';

            return (
              <motion.div
                key={topicScore.topic}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.2 + i * 0.1,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
                className={`${size} rounded-full flex flex-col items-center justify-center shadow-lg relative`}
                style={{
                  background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                }}
              >
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-800">
                  {topicScore.rank}
                </div>
                <span className={isPrimary ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'}>{meta.emoji}</span>
                <span className={`text-white font-semibold mt-1 ${isPrimary ? 'text-[10px] sm:text-xs md:text-sm' : 'text-[8px] sm:text-[10px] md:text-xs'}`}>
                  {meta.name}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Primary Topic Keywords */}
        {primaryMeta && topicWords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl sm:text-2xl">{primaryMeta.emoji}</span>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Deine {primaryMeta.name}-Wörter
              </h3>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {topicWords.slice(0, 6).map((tw, i) => (
                <motion.div
                  key={tw.word}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 + i * 0.05, type: 'spring' }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-white"
                  style={{
                    backgroundColor: `${partyColor}30`,
                    borderColor: `${partyColor}50`,
                    borderWidth: 1,
                  }}
                >
                  {tw.word}
                  <span className="ml-1 sm:ml-1.5 opacity-60">{tw.count}×</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </SlideContainer>
  );
}
