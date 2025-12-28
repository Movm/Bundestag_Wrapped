import { useWrappedData } from '@/hooks/useDataQueries';
import { SubpageWrapper } from '../shared';
import { SpeakerSection } from '../SpeakerSection';

export default function RednerInnenPage() {
  const { data, isLoading, error } = useWrappedData();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return <PageError error={error} />;
  }

  return (
    <SubpageWrapper sectionId="speakers">
      <SpeakerSection
        topSpeakers={data.topSpeakers}
        topSpeakersByWords={data.topSpeakersByWords}
        topSpeakersByAvgWords={data.topSpeakersByAvgWords}
        topBefragungResponders={data.topBefragungResponders}
        defaultExpanded
      />
    </SubpageWrapper>
  );
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">Lade Redner:innen...</p>
      </div>
    </div>
  );
}

function PageError({ error }: { error: Error | null }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 text-xl mb-4">Fehler beim Laden</p>
        <p className="text-white/60">{error?.message}</p>
      </div>
    </div>
  );
}
