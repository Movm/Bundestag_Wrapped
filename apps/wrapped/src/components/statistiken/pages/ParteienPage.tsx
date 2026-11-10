import { useWrappedData } from '@/hooks/useDataQueries';
import { SubpageWrapper } from '../shared';
import { PartySection } from '../PartySection';

export default function ParteienPage() {
  const { data, isLoading, error } = useWrappedData();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return <PageError error={error} />;
  }

  return (
    <SubpageWrapper sectionId="parties">
      <PartySection parties={data.parties} topicAnalysis={data.topicAnalysis} defaultExpanded />
    </SubpageWrapper>
  );
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-on-muted">Lade Parteien...</p>
      </div>
    </div>
  );
}

function PageError({ error }: { error: Error | null }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 text-xl mb-4">Fehler beim Laden</p>
        <p className="text-on-muted">{error?.message}</p>
      </div>
    </div>
  );
}
