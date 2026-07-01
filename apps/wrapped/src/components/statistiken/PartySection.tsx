import { motion } from 'motion/react';
import { useRef, useMemo } from 'react';
import type { PartyStats, TopicAnalysis } from '@/data/wrapped';
import { getPartyColor, getPartyTextColor } from '@/lib/party-colors';
import { formatNumber } from '@/lib/utils';
import { SectionHeader, SectionWrapper, SECTION_CONFIG } from './shared';
import { TOPIC_BY_ID } from '@/shared/constants/topics';

interface PartySectionProps {
  parties: PartyStats[];
  /** Topic analysis data with byParty scores */
  topicAnalysis?: TopicAnalysis | null;
  /** Show expanded by default (for standalone subpages) */
  defaultExpanded?: boolean;
}

const config = SECTION_CONFIG.parties;

// Convert party topic scores to sorted array with metadata
function getPartyTopics(partyName: string, topicAnalysis?: TopicAnalysis | null) {
  if (!topicAnalysis?.byParty?.[partyName]) return [];

  const partyScores = topicAnalysis.byParty[partyName];

  return Object.entries(partyScores)
    .map(([topicId, score]) => ({
      id: topicId,
      score: score as number,
      meta: TOPIC_BY_ID[topicId],
    }))
    .filter((t) => t.meta) // Only topics with metadata
    .sort((a, b) => b.score - a.score);
}

export function PartySection({ parties, topicAnalysis }: PartySectionProps) {
  return (
    <SectionWrapper sectionId="parties" noPadding>
      {/* HEADER */}
      <div className="pt-16 pb-8">
        <SectionHeader
          emoji={config.emoji}
          title={config.title}
          subtitle={config.subtitle}
          accentColor={config.accent}
          hideNumber
          className="mb-8"
        />
      </div>

      {/* ALL PARTIES SHOWCASE */}
      <div className="pb-12 px-4">
        <div className="space-y-8 max-w-5xl mx-auto">
          {parties.map((party, i) => (
            <PartyHeroCard
              key={party.party}
              party={party}
              index={i}
              topicAnalysis={topicAnalysis}
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

interface PartyHeroCardProps {
  party: PartyStats;
  index: number;
  topicAnalysis?: TopicAnalysis | null;
}

function PartyHeroCard({ party, index, topicAnalysis }: PartyHeroCardProps) {
  const partyColor = getPartyColor(party.party);
  const partyTextColor = getPartyTextColor(party.party);
  const totalContributions = party.speeches + (party.wortbeitraege || 0);

  const cardRef = useRef<HTMLDivElement>(null);

  // Get sorted topics for this party
  const partyTopics = useMemo(
    () => getPartyTopics(party.party, topicAnalysis),
    [party.party, topicAnalysis]
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden bg-gray-950"
      style={{
        border: `2px solid ${partyColor}`,
      }}
    >
      {/* Content */}
      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        {/* Header: Party Name + Color Indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: partyColor }}
          />
          <h3 className="text-3xl md:text-4xl font-black text-white">
            {party.party}
          </h3>
        </div>

        {/* TOPICS - Main Focus, Big and Present */}
        {partyTopics.length > 0 && (
          <div className="mb-8">
            {/* Top 5 Topics - Large Colorful Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              {partyTopics.slice(0, 5).map((topic, i) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex flex-col items-center justify-center p-4 md:p-5 rounded-2xl text-center"
                  style={{
                    background: `linear-gradient(145deg, ${topic.meta.color}, ${topic.meta.color}bb)`,
                  }}
                >
                  <span className="text-3xl md:text-4xl mb-2">{topic.meta.emoji}</span>
                  <span className="text-white font-bold text-sm md:text-base leading-tight">
                    {topic.meta.name}
                  </span>
                  <span className="text-white/60 text-xs mt-1">
                    {topic.score.toFixed(1)}%
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Remaining Topics - Compact Grid */}
            {partyTopics.length > 5 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {partyTopics.slice(5).map((topic, i) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.02 }}
                    className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5"
                  >
                    <span className="text-lg">{topic.meta.emoji}</span>
                    <span className="text-white text-sm flex-1 truncate">{topic.meta.name}</span>
                    <span className="text-white/40 text-xs">{topic.score.toFixed(1)}%</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Signature Words */}
        {party.signatureWords && party.signatureWords.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white/40 text-xs uppercase tracking-wider mb-3">Signature-Wörter</h4>
            <div className="flex flex-wrap gap-2">
              {party.signatureWords.slice(0, 6).map((word) => (
                <span
                  key={word.word}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border"
                  style={{
                    borderColor: `${partyColor}60`,
                    color: partyTextColor,
                    backgroundColor: `${partyColor}15`,
                  }}
                >
                  {word.word} <span className="opacity-60">({word.ratio.toFixed(1)}×)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM: Stats + Wortbeiträge */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/50 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{formatNumber(totalContributions)}</span>
              <span>Wortbeiträge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{formatNumber(party.speeches)}</span>
              <span>Reden</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{formatNumber(party.uniqueSpeakers)}</span>
              <span>Redner:innen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{formatNumber(party.totalWords)}</span>
              <span>Wörter</span>
            </div>
            {party.topSpeaker?.name && (
              <div className="flex items-center gap-2">
                <span className="text-white/40">Top:</span>
                <span className="text-white">{party.topSpeaker.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
