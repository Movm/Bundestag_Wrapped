import { motion } from 'motion/react';
import { useWrappedData } from '@/hooks/useDataQueries';
import { Footer } from '@/components/ui/Footer';
import { HeroSection } from './statistiken/HeroSection';
import { PartySection } from './statistiken/PartySection';
import { SpeakerSection } from './statistiken/SpeakerSection';
import { ToneSection } from './statistiken/ToneSection';
import { DramaSection } from './statistiken/DramaSection';
import { GenderSection } from './statistiken/GenderSection';
import { CommonWordsSection } from './statistiken/CommonWordsSection';

export function StatistikenPage() {
  const { data, isLoading: loading, error } = useWrappedData();

  if (loading) {
    return (
      <div className="min-h-screen bg-wr-ink flex items-center justify-center">
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
      <div className="min-h-screen bg-wr-ink flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-on text-xl mb-4">Fehler beim Laden der Daten</p>
          <p className="text-on-muted">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wr-ink relative">

      <main className="relative z-10">
        <section id="overview">
          <HeroSection metadata={data.metadata} funFacts={data.funFacts} />
        </section>

        <section id="parties">
          <PartySection parties={data.parties} topicAnalysis={data.topicAnalysis} />
        </section>

        <section id="speakers">
          <SpeakerSection
            topSpeakers={data.topSpeakers}
            topSpeakersByWords={data.topSpeakersByWords}
            topSpeakersByAvgWords={data.topSpeakersByAvgWords}
            topBefragungResponders={data.topBefragungResponders}
          />
        </section>

        {data.toneAnalysis && (
          <section id="tone">
            <ToneSection toneAnalysis={data.toneAnalysis} />
          </section>
        )}

        <section id="drama">
          <DramaSection drama={data.drama} />
        </section>

        {data.genderAnalysis && (
          <section id="gender">
            <GenderSection genderAnalysis={data.genderAnalysis} />
          </section>
        )}

        <section id="topics">
          <CommonWordsSection commonWords={data.hotTopics} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
