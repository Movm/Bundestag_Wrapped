import { motion } from 'motion/react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark } from '@/design-system/components/Type';
import { ChipCloud, RankCard } from '@/design-system/components/Data';
import { ENTER } from '@/design-system/motion';
import { TOPIC_BY_ID } from '@/components/slides/TopicsSlide/constants';
import './speaker.css';

interface SpeakerTopicsSlideProps {
  speaker: SpeakerWrapped;
}

/** Top topics as a stair-stepped ranking, plus the words of the leading topic. */
export function SpeakerTopicsSlide({ speaker }: SpeakerTopicsSlideProps) {
  const { topics } = speaker;
  if (!topics || topics.topTopics.length === 0) return null;

  const topTopics = topics.topTopics.slice(0, 5).filter(score => TOPIC_BY_ID[score.topic]);
  const primary = topTopics[0];
  const primaryMeta = primary ? TOPIC_BY_ID[primary.topic] : null;
  const topicWords = primary ? topics.topicWords[primary.topic] ?? [] : [];

  return (
    <Slide shapes="corner">
      <Display size="lg">Worüber du <Mark>am meisten</Mark> sprichst</Display>
      <div className="sp-topics">
        <ol className="sp-topics__ranks m-0 list-none p-0" aria-label="Deine Top-Themen">
          {topTopics.map((score, index) => (
            <li key={score.topic}>
              <RankCard rank={score.rank} label={TOPIC_BY_ID[score.topic].name} tone={index === 0 ? 'pink' : 'white'} step={index} />
            </li>
          ))}
        </ol>
        {primaryMeta && topicWords.length > 0 && (
          <div className="flex min-w-0 flex-col items-start gap-4">
            <motion.div variants={ENTER.stamp} className="rotate-[-3deg]">
              <Eyebrow>Deine {primaryMeta.name}-Wörter</Eyebrow>
            </motion.div>
            <ChipCloud words={topicWords.slice(0, 6).map(word => `${word.word} ${word.count}×`)} label={`Deine ${primaryMeta.name}-Wörter mit Anzahl`} />
          </div>
        )}
      </div>
    </Slide>
  );
}
