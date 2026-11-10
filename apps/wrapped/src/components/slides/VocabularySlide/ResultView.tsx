import type { PartyStats } from '@/data/wrapped';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark } from '@/design-system/components/Type';
import { PartyBlock, PartyGrid } from '@/design-system/components/PartyBlock';

interface ResultViewProps {
  parties: PartyStats[];
}

export function ResultView({ parties }: ResultViewProps) {
  const topParties = parties.filter(p => p.party !== 'fraktionslos').slice(0, 5);

  return (
    <Slide shapes="corner">
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Diese Wörter zeichnen die Parteien aus</Eyebrow></Enter>
        <Display size="xl" face="wide">
          Partei-<Mark>Vokabular.</Mark>
        </Display>
      </div>
      <PartyGrid label="Signature Words je Fraktion">
        {topParties.map(party => {
          const [lead, ...rest] = party.signatureWords;
          return (
            <PartyBlock key={party.party} party={party.party}>
              <p lang="de" className="m-0 font-wide text-[clamp(1.5rem,0.9rem+2.4vw,3.25rem)] font-black uppercase leading-[0.95] [hyphens:auto] [overflow-wrap:anywhere]">
                {lead?.word ?? '–'}
              </p>
              {rest.length > 0 && (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={`Weitere Wörter von ${party.party}`}>
                  {rest.slice(0, 4).map(item => (
                    <li key={item.word} lang="de" className="rounded-full bg-white px-3 py-1 text-sm font-bold text-wr-ink [overflow-wrap:anywhere]">
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
