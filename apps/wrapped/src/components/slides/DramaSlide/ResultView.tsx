import type { DramaStats } from '@/data/wrapped';
import { formatNumber } from '@/lib/utils';
import { getPartyTone } from '@/lib/party-colors';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { HeroStat } from '@/design-system/components/HeroStat';
import { RankCard } from '@/design-system/components/Data';

interface ResultViewProps {
  drama: DramaStats;
}

export function ResultView({ drama }: ResultViewProps) {
  const [leader, ...others] = drama.topZwischenrufer;
  if (!leader) return null;
  const podium = [leader, ...others].slice(0, 3);

  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Die Auswertung zeigt den höchsten gezählten Wert dieser Edition.</Note>}
    >
      <div className="grid items-center gap-[clamp(1.5rem,4vw,4rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
        <div className="flex min-w-0 flex-col items-start gap-4">
          <Eyebrow>Drama im Plenum</Eyebrow>
          <Display size="xl" face="wide">Die lauteste <Mark>Stimme.</Mark></Display>
          <HeroStat value={formatNumber(leader.count)} label="Zwischenrufe" />
        </div>
        <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Meiste Zwischenrufe">
          {podium.map((item, index) => (
            <li key={`${item.name}-${item.party}`}>
              <RankCard
                rank={index + 1}
                label={item.name}
                detail={<><span style={{ color: getPartyTone(item.party, 'light') }}>{item.party}</span> · {formatNumber(item.count)} Zwischenrufe</>}
                tone="white"
                step={index}
              />
            </li>
          ))}
        </ol>
      </div>
    </Slide>
  );
}
