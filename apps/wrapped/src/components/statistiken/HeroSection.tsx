import { motion } from 'motion/react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { SectionHeader, SectionWrapper, HeroStat, ExpandableDetails, SECTION_CONFIG } from './shared';
import type { FunFact } from '@/data/wrapped';

interface HeroSectionProps {
  metadata: {
    totalSpeeches: number;
    totalWords: number;
    partyCount: number;
    speakerCount: number;
    wahlperiode: number;
    sitzungen: number;
  };
  funFacts?: FunFact[];
}

const config = SECTION_CONFIG.overview;

export function HeroSection({ metadata, funFacts }: HeroSectionProps) {
  return (
    <SectionWrapper sectionId="overview" showTopBorder={false} noPadding>
      {/* HERO ZONE - Giant stat fills viewport */}
      <div className="min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-16">
        <SectionHeader
          sectionNumber={config.number}
          emoji={config.emoji}
          title={config.title}
          subtitle={`Die ${metadata.wahlperiode}. Wahlperiode`}
          accentColor={config.accent}
          size="large"
          className="mb-12"
        />

        {/* THE HERO STAT - Total Words */}
        <HeroStat
          value={metadata.totalWords}
          label="Wörter gesprochen"
          sublabel="im Deutschen Bundestag"
          suffix="M"
          format="compact"
          color={config.accent}
        />
      </div>

      {/* EXPANDABLE DETAILS */}
      <div className="py-12">
        <ExpandableDetails
          expandLabel="Statistiken & Fun Facts anzeigen"
          collapseLabel="Details ausblenden"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl mx-auto mb-16"
          >
            <StatCard
              value={metadata.totalSpeeches}
              label="Reden"
              icon="🎤"
            />
            <StatCard
              value={metadata.speakerCount}
              label="Redner:innen"
              icon="👥"
            />
            <StatCard
              value={metadata.sitzungen}
              label="Sitzungen"
              icon="📅"
            />
            <StatCard
              value={metadata.partyCount}
              label="Fraktionen"
              icon="🏛️"
            />
          </motion.div>

          {funFacts && funFacts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-5xl mx-auto"
            >
              <h2 className="text-xl font-bold text-on mb-6 text-center">Fun Facts</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {funFacts.slice(0, 8).map((fact, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-wr-card rounded-xl p-4 border border-track hover:border-track transition-colors"
                  >
                    <span className="text-2xl block mb-2">{fact.emoji}</span>
                    <p className="text-on font-bold text-lg">{fact.value}</p>
                    <p className="text-on-muted text-sm">{fact.label}</p>
                    {fact.sublabel && (
                      <p className="text-on-muted text-xs mt-1">{fact.sublabel}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </ExpandableDetails>
      </div>
    </SectionWrapper>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  icon: string;
}

function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-wr-card rounded-2xl p-5 border border-track hover:border-wr-pink transition-colors text-center"
    >
      <span aria-hidden="true" className="hidden">{icon}</span>
      <AnimatedCounter
        value={value}
        className="text-2xl md:text-3xl font-black text-on"
      />
      <p className="text-on-muted text-sm mt-1">{label}</p>
    </motion.div>
  );
}
