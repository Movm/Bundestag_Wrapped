import { useWrappedData } from '@/hooks/useDataQueries';
import { SubpageWrapper } from '../shared';
import { GenderSection } from '../GenderSection';

export default function GeschlechtPage() {
  const { data, isLoading, error } = useWrappedData();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data || !data.genderAnalysis) {
    return <PageError error={error} />;
  }

  return (
    <SubpageWrapper sectionId="gender">
      <GenderSection genderAnalysis={data.genderAnalysis} defaultExpanded />
    </SubpageWrapper>
  );
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-on-muted">Lade Geschlechter-Analyse...</p>
      </div>
    </div>
  );
}

function PageError({ error }: { error: Error | null }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 text-xl mb-4">Fehler beim Laden</p>
        <p className="text-on-muted">{error?.message || 'Keine Geschlechter-Daten verfügbar'}</p>
      </div>
    </div>
  );
}
