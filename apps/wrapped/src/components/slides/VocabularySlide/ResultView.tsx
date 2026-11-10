import type { PartyStats } from '@/data/wrapped';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, FitWord } from '@/design-system/components/Type';

const factor = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
import { PartyBlock, PartyGrid } from '@/design-system/components/PartyBlock';

interface ResultViewProps {
  parties: PartyStats[];
}

export function ResultView({ parties }: ResultViewProps) {
  const topParties = parties.filter(p => p.party !== 'fraktionslos').slice(0, 5);

  return (
    <Slide shapes="corner">
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Fällt auf im Vergleich zu den anderen Fraktionen</Eyebrow></Enter>
        <Display size="xl" face="wide">
          Typische <Mark>Wörter.</Mark>
        </Display>
      </div>
      <PartyGrid label="Typische Wörter je Fraktion">
        {topParties.map(party => {
          const [lead, ...rest] = party.signatureWords;
          return (
            <PartyBlock key={party.party} party={party.party}>
              <FitWord word={lead?.word ?? '–'} />
              {lead && <p className="m-0 text-base font-semibold">{factor.format(lead.ratio)}× so oft wie im Schnitt der anderen</p>}
              {rest.length > 0 && (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={`Weitere Wörter von ${party.party}`}>
                  {rest.slice(0, 4).map(item => (
                    <li key={item.word} lang="de" className="rounded-full bg-white px-3 py-1 font-wide text-base font-extrabold text-wr-ink [overflow-wrap:anywhere]">
                      {item.word}
                    </li>
                  ))}
                </ul>
              )}
            </PartyBlock>
          );
        })}
      </PartyGrid>
    </Slide>
  );
}
