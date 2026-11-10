import { useMemo } from 'react';
import type { TopicAnalysis } from '@/data/wrapped';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { ChipCloud, RankCard } from '@/design-system/components/Data';
import { TOPIC_BY_ID } from './constants';

interface ResultViewProps {
  topicAnalysis: TopicAnalysis;
}

const RANK_TONES = ['white', 'violet', 'pink', 'card', 'white'] as const;

function topPartiesFor(byParty: TopicAnalysis['byParty'], topic: string, count: number): string[] {
  return Object.entries(byParty)
    .filter(([party]) => party !== 'fraktionslos')
    .map(([party, topics]) => ({ party, score: topics[topic] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => item.party);
}

export function ResultView({ topicAnalysis }: ResultViewProps) {
  const { topTopics, byParty } = topicAnalysis;

  const leaders = useMemo(
    () => topTopics.slice(0, 5).map(item => ({ ...item, parties: topPartiesFor(byParty, item.topic, 3) })),
    [topTopics, byParty],
  );
  const others = useMemo(
    () => topTopics.slice(5, 13).map(item => TOPIC_BY_ID[item.topic]?.name ?? item.topic),
    [topTopics],
  );

  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Am meisten gesprochen wurde über diese Themen. Darunter: wer sie am stärksten besetzt.</Note>}
    >
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Worüber wurde am meisten gesprochen?</Eyebrow></Enter>
        <Display size="xl" face="wide">
          Die Themen des <Mark>Bundestags.</Mark>
        </Display>
      </div>
      <ol className="flex flex-col gap-3" aria-label="Die häufigsten Themen">
        {leaders.map((item, index) => (
          <li key={item.topic}>
            <RankCard
              rank={item.rank}
              label={TOPIC_BY_ID[item.topic]?.name ?? item.topic}
              detail={item.parties.length > 0 ? `Vorn: ${item.parties.join(', ')}` : undefined}
              tone={RANK_TONES[index % RANK_TONES.length]}
              step={index}
            />
          </li>
        ))}
      </ol>
      {others.length > 0 && <ChipCloud words={others} label="Weitere Themen" />}
    </Slide>
  );
}
