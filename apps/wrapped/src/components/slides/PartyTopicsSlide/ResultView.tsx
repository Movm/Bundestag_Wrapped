import { useMemo } from 'react';
import type { TopicAnalysis } from '@/data/wrapped';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import { selectDisplayParties } from '@/domain/party-selection';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark } from '@/design-system/components/Type';
import { PartyBlock, PartyGrid } from '@/design-system/components/PartyBlock';

interface ResultViewProps {
  topicAnalysis: TopicAnalysis;
}

export function ResultView({ topicAnalysis }: ResultViewProps) {
  const { byParty } = topicAnalysis;
  const displayParties = useMemo(() => selectDisplayParties(byParty), [byParty]);

  const partyTopics = useMemo(
    () =>
      displayParties.flatMap(party => {
        const data = byParty[party];
        if (!data) return [];
        const topics = Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([topic]) => TOPIC_BY_ID[topic]?.name ?? topic);
        return [{ party, topics }];
      }),
    [byParty, displayParties],
  );

  return (
    <Slide shapes="corner">
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Worüber sprechen die Fraktionen am meisten?</Eyebrow></Enter>
        <Display size="xl" face="wide">
          Die Themen der <Mark>Parteien.</Mark>
        </Display>
      </div>
      <PartyGrid label="Top-Themen je Fraktion">
        {partyTopics.map(({ party, topics }) => (
          <PartyBlock key={party} party={party}>
            <ol className="m-0 flex list-none flex-col gap-1 p-0" aria-label={`Themen von ${party}`}>
              {topics.map((topic, index) => (
                <li
                  key={topic}
                  className={index === 0 ? 'font-heading text-[clamp(1.375rem,1rem+1.6vw,2.25rem)] font-black uppercase leading-none' : 'text-[clamp(0.9375rem,0.85rem+0.4vw,1.125rem)] font-bold'}
                >
                  <span className="sr-only">Platz {index + 1}: </span>{topic}
                </li>
              ))}
            </ol>
          </PartyBlock>
        ))}
      </PartyGrid>
    </Slide>
  );
}
