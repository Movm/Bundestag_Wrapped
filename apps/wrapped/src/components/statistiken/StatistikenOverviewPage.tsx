import { motion } from 'motion/react';
import { useWrappedData } from '@/hooks/useDataQueries';
import { formatNumber } from '@/lib/utils';
import { StatCard } from './cards';
import { SECTION_CONFIG, SUBPAGE_ORDER } from './shared/section-config';
import { SectionHeader } from './shared';

/**
 * Overview dashboard for the statistiken section.
 * Shows key metrics and links to each detailed section.
 */
export function StatistikenOverviewPage() {
  const { data, isLoading, error } = useWrappedData();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-on-muted">Lade Statistiken...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">Fehler beim Laden der Daten</p>
          <p className="text-on-muted">{error?.message}</p>
        </div>
      </div>
    );
  }

  const config = SECTION_CONFIG.overview;

  // Compute hero values for each section
  const sectionStats: Record<string, { value: number | string; label: string; sublabel?: string; format: 'compact' | 'text' | 'percentage' | 'number' }> = {
    parties: {
      value: data.parties?.[0]?.totalWords || 0,
      label: 'Wörter gesprochen',
      sublabel: data.parties?.[0]?.party || 'Top Fraktion',
      format: 'compact',
    },
    speakers: {
      value: data.topSpeakersByWords?.[0]?.totalWords || 0,
      label: 'Wörter',
      sublabel: data.topSpeakersByWords?.[0]?.name || 'Top Redner:in',
      format: 'compact',
    },
    tone: {
      value: data.toneAnalysis?.rankings?.aggression?.[0]?.party || 'AfD',
      label: 'Aggressivster Ton',
      format: 'text',
    },
    drama: {
      value: data.drama?.zwischenrufStats?.total || 0,
      label: 'Zwischenrufe',
      format: 'compact',
    },
    gender: {
      value: Math.round(data.genderAnalysis?.distribution?.femalePercent || 35),
      label: 'Frauenanteil',
      format: 'percentage',
    },
    topics: {
      value: data.hotTopics?.[0] || 'Deutschland',
      label: 'Häufigstes Wort',
      format: 'text',
    },
  };

  return (
    <div className="py-12 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <SectionHeader
          sectionNumber={config.number}
          emoji={config.emoji}
          title={config.title}
          subtitle={`Die ${data.metadata?.wahlperiode || 21}. Wahlperiode in Zahlen`}
          explanation={config.explanation}
          accentColor={config.accent}
          size="large"
        />
      </div>

      {/* Key metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto mb-16"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            value={data.metadata?.totalWords || 0}
            label="Wörter"
            format="compact"
            accent={config.accent}
          />
          <MetricCard
            value={data.metadata?.totalSpeeches || 0}
            label="Reden"
            format="number"
            accent={config.accent}
          />
          <MetricCard
            value={data.metadata?.speakerCount || 0}
            label="Redner:innen"
            format="number"
            accent={config.accent}
          />
          <MetricCard
            value={data.metadata?.sitzungen || 0}
            label="Sitzungen"
            format="number"
            accent={config.accent}
          />
        </div>
      </motion.div>

      {/* Section cards grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-xl font-bold text-on mb-6 text-center">
          Detaillierte Analysen
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUBPAGE_ORDER.map((sectionId, index) => {
            const sectionConfig = SECTION_CONFIG[sectionId];
            const stats = sectionStats[sectionId as keyof typeof sectionStats];

            return (
              <motion.div
                key={sectionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <StatCard
                  to={sectionConfig.path}
                  config={sectionConfig}
                  heroValue={stats?.value || 0}
                  heroLabel={stats?.label || ''}
                  heroSublabel={stats?.sublabel}
                  format={stats?.format || 'number'}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

interface MetricCardProps {
  value: number;
  label: string;
  format: 'number' | 'compact' | 'percentage';
  accent: string;
}

function MetricCard({ value, label, format, accent }: MetricCardProps) {
  const displayValue =
    format === 'compact'
      ? value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1_000
          ? `${Math.round(value / 1_000)}K`
          : formatNumber(value)
      : format === 'percentage'
        ? `${value}%`
        : formatNumber(value);

  return (
    <div className="bg-wr-card rounded-xl p-4 text-center border border-track">
      <p className="text-3xl md:text-4xl font-black" style={{ color: accent }}>
        {displayValue}
      </p>
      <p className="text-on-muted text-sm mt-1">{label}</p>
    </div>
  );
}
