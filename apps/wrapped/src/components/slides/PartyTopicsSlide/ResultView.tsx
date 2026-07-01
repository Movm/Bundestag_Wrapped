import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import type { TopicAnalysis } from '@/data/wrapped';
import { BUBBLE_POSITIONS, FLOAT_ANIMATIONS, FlipCard } from '../shared';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import { getPartyBgColor } from '@/lib/party-colors';

interface ResultViewProps {
  topicAnalysis: TopicAnalysis;
}

interface TopicScore {
  topic: string;
  score: number;
}

// The 5 main parties to display (excludes fraktionslos)
const DISPLAY_PARTIES = ['AfD', 'CDU/CSU', 'DIE LINKE', 'GRÜNE', 'SPD'];

interface PartyBubbleProps {
  party: string;
  topTopics: TopicScore[];
  index: number;
  position: { top: string; left: string };
  floatOffset: { x: number[]; y: number[] };
  duration: number;
}

const PartyBubble = memo(function PartyBubble({
  party,
  topTopics,
  index,
  position,
  floatOffset,
  duration,
}: PartyBubbleProps) {
  const partyColor = getPartyBgColor(party);

  const bubbleClasses = `
    w-full h-full
    rounded-full
    shadow-2xl shadow-black/30
    flex flex-col items-center justify-center
    p-3 text-center
  `;

  const frontContent = (
    <div
      className={bubbleClasses}
      style={{ background: `linear-gradient(135deg, ${partyColor}, ${partyColor}dd)` }}
    >
      <span className="text-white font-black text-xl md:text-2xl drop-shadow-md leading-tight">
        {party}
      </span>
    </div>
  );

  const backContent = (
    <div
      className={bubbleClasses}
      style={{ background: `linear-gradient(135deg, ${partyColor}ee, ${partyColor}cc)` }}
    >
      <div className="space-y-1 px-1">
        {topTopics.map((ts, i) => {
          const topic = TOPIC_BY_ID[ts.topic];
          if (!topic) return null;
          return (
            <div key={ts.topic} className="flex items-center gap-1.5 justify-center">
              <span className="text-white/60 text-[10px] md:text-xs w-3">{i + 1}.</span>
              <div
                className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: topic.color }}
              />
              <span className="text-white text-[10px] md:text-xs font-semibold truncate max-w-[60px] md:max-w-[80px]">
                {topic.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Alternate tilt directions for visual interest
  const tiltAngle = index % 2 === 0 ? -8 : 8;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: tiltAngle }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.4,
        type: 'spring',
        stiffness: 110,
        damping: 12,
      }}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
      }}
    >
      <motion.div
        animate={{ x: floatOffset.x, y: floatOffset.y }}
        transition={{
          repeat: Infinity,
          duration,
          ease: 'easeInOut',
        }}
        style={{ willChange: 'transform' }}
      >
        <FlipCard
          front={frontContent}
          back={backContent}
          className="w-[28vw] h-[28vw] max-w-[200px] max-h-[200px] min-w-[110px] min-h-[110px]"
        />
      </motion.div>
    </motion.div>
  );
});

export function ResultView({ topicAnalysis }: ResultViewProps) {
  const { byParty } = topicAnalysis;

  // Compute top 3 topics for each party
  const partyTopTopics = useMemo(() => {
    const result: Record<string, TopicScore[]> = {};
    for (const party of DISPLAY_PARTIES) {
      const partyData = byParty[party];
      if (!partyData) continue;

      const sorted = Object.entries(partyData)
        .map(([topic, score]) => ({ topic, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      result[party] = sorted;
    }
    return result;
  }, [byParty]);

  return (
    <div className="min-h-screen relative w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="absolute top-8 left-0 right-0 text-center z-20"
      >
        <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
          Die Themen der Parteien
        </h2>
        <p className="text-white/50 text-xs md:text-sm">
          Worüber sprechen die Fraktionen am meisten?
        </p>
      </motion.div>

      <div className="absolute inset-0 z-10">
        {DISPLAY_PARTIES.map((party, i) => {
          const topTopics = partyTopTopics[party];
          if (!topTopics) return null;
          return (
            <PartyBubble
              key={party}
              party={party}
              topTopics={topTopics}
              index={i}
              position={BUBBLE_POSITIONS[i]}
              floatOffset={FLOAT_ANIMATIONS[i]}
              duration={FLOAT_ANIMATIONS[i].duration}
            />
          );
        })}
      </div>
    </div>
  );
}
