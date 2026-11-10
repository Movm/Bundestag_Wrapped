import { useMemo } from 'react';
import { getPartyTone } from '@/lib/party-colors';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Lead, Mark } from '@/design-system/components/Type';
import { RankCard } from '@/design-system/components/Data';
import type { MoinSpeaker } from './moin-quiz';

interface ResultViewProps {
  speakers: MoinSpeaker[];
}

export function ResultView({ speakers }: ResultViewProps) {
  const topSpeakers = useMemo(() => speakers.slice(0, 4), [speakers]);

  return (
    <Slide shapes="corner">
      <div className="flex flex-col items-start gap-4">
        <Eyebrow>Norddeutsche Grüße im Bundestag</Eyebrow>
        <Display size="xl" face="wide">Die <Mark>Moin</Mark>-Champions.</Display>
        <Lead>Wer grüßt am häufigsten mit „Moin“?</Lead>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Moin-Champions">
        {topSpeakers.map((speaker, index) => (
          <li key={speaker.name}>
            <RankCard
              rank={index + 1}
              label={speaker.name}
              detail={<><span style={{ color: getPartyTone(speaker.party, 'light') }}>{speaker.party}</span> · {speaker.count}× „Moin“</>}
              tone="white"
              step={index}
            />
          </li>
        ))}
      </ol>
    </Slide>
  );
}
