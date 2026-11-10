import { useMemo } from 'react';
import type { ToneAnalysis } from '@/data/wrapped';
import { getPartyTone } from '@/lib/party-colors';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Lead, Mark, Note } from '@/design-system/components/Type';
import { RankCard } from '@/design-system/components/Data';

interface ResultViewProps {
  toneAnalysis?: ToneAnalysis | null;
}

export function ResultView({ toneAnalysis }: ResultViewProps) {
  const rankings = useMemo(() => {
    const counts = toneAnalysis?.rankings?.discriminatoryCounts;
    if (counts && counts.length > 0) {
      return counts.filter((r) => r.party !== 'fraktionslos').slice(0, 5);
    }
    return [];
  }, [toneAnalysis]);

  if (rankings.length === 0) {
    return (
      <Slide>
        <Lead>Keine Daten verfügbar</Lead>
      </Slide>
    );
  }

  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Begriffe wie „Remigration“, „Genderideologie“ oder „Überfremdung“</Note>}
    >
      <div className="flex flex-col items-start gap-4">
        <Eyebrow>Fraktionen im Vergleich</Eyebrow>
        <Display size="lg" face="wide">Diskriminierende <Mark>Sprache.</Mark></Display>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Fraktionen nach Anzahl diskriminierender Begriffe">
        {rankings.map((ranking, index) => (
          <li key={ranking.party}>
            <RankCard
              rank={index + 1}
              label={ranking.party}
              detail={<span style={{ color: getPartyTone(ranking.party, 'light') }}>{ranking.count}× gezählt</span>}
              tone="white"
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}
