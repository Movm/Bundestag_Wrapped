import { useMemo } from 'react';
import type { GenderAnalysis } from '@/data/wrapped';
import { getPartyTone } from '@/lib/party-colors';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { HeroStat } from '@/design-system/components/HeroStat';
import { RankCard } from '@/design-system/components/Data';

interface ResultViewProps {
  genderAnalysis: GenderAnalysis;
}

export function ResultView({ genderAnalysis }: ResultViewProps) {
  const { distribution, byParty } = genderAnalysis;

  const sortedParties = useMemo(
    () =>
      [...byParty]
        .filter((p) => p.party !== 'fraktionslos')
        .sort((a, b) => b.femaleRatio - a.femaleRatio),
    [byParty]
  );

  const topParty = sortedParties[0];
  const bottomParty = sortedParties[sortedParties.length - 1];
  const extremes = topParty && bottomParty && topParty !== bottomParty ? [topParty, bottomParty] : topParty ? [topParty] : [];

  return (
    <Slide shapes="corner" footer={<Note className="ds-note--plate">Anteil der Redebeiträge von Frauen.</Note>}>
      <div className="grid items-center gap-[clamp(1.5rem,4vw,4rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
        <div className="flex min-w-0 flex-col items-start gap-4">
          <Eyebrow>Redeanteile im Bundestag</Eyebrow>
          <Display size="lg" face="wide">Frauen im <Mark>Plenum.</Mark></Display>
          <HeroStat value={`${distribution.femalePercent.toFixed(0)} %`} label="Frauenanteil" />
        </div>
        <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Höchster und niedrigster Frauenanteil nach Fraktion">
          {extremes.map((item, index) => (
            <li key={item.party}>
              <RankCard
                rank={index === 0 ? 1 : sortedParties.length}
                label={item.party}
                detail={<span style={{ color: getPartyTone(item.party, 'light') }}>{item.femaleRatio.toFixed(0)} % Frauenanteil</span>}
                tone="white"
                step={index * 2}
              />
            </li>
          ))}
        </ol>
      </div>
    </Slide>
  );
}
