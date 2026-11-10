import type { ToneAnalysis } from '@/data/wrapped';
import { getPartyTone } from '@/lib/party-colors';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark } from '@/design-system/components/Type';
import { RankCard } from '@/design-system/components/Data';
import { TONE_CATEGORIES } from './constants';

interface LegacyResultViewProps {
  toneAnalysis: ToneAnalysis;
}

export function LegacyResultView({ toneAnalysis }: LegacyResultViewProps) {
  const { rankings } = toneAnalysis;
  const winners = TONE_CATEGORIES.flatMap(cat => {
    const winner = rankings[cat.key]?.[0];
    return winner ? [{ label: cat.label, party: winner.party }] : [];
  });

  return (
    <Slide shapes="corner">
      <div className="flex flex-col gap-4">
        <Eyebrow>Wrapped 2025</Eyebrow>
        <Display size="xl" face="wide">Der Ton der <Mark>Parteien.</Mark></Display>
      </div>
      <ol className="m-0 grid list-none gap-3 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]" aria-label="Wer klingt wie">
        {winners.map((item, index) => (
          <li key={item.label}>
            <RankCard rank={index + 1} label={item.label} detail={<span style={{ color: getPartyTone(item.party, 'light') }}>{item.party}</span>} tone="white" step={3} />
          </li>
        ))}
      </ol>
    </Slide>
  );
}
