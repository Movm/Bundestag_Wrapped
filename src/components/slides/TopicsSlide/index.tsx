import { memo } from 'react';
import type { TopicAnalysis } from '@/data/wrapped';
import { INTRO_SLIDES } from '@/data/intro-slides';
import { SlideIntro, type SlidePhase } from '../shared';
import { ResultView } from './ResultView';

interface TopicsSlidezProps {
  topicAnalysis: TopicAnalysis;
  phase?: SlidePhase;
}

export const TopicsSlide = memo(function TopicsSlide({
  topicAnalysis,
  phase = 'result',
}: TopicsSlidezProps) {
  if (phase === 'intro') {
    const intro = INTRO_SLIDES['intro-topics'];
    return (
      <SlideIntro
        emoji={intro.emoji}
        title={intro.title}
        subtitle={intro.subtitle}
        slideId="intro-topics"
      />
    );
  }

  return <ResultView topicAnalysis={topicAnalysis} />;
});

export { TOPICS, TOPIC_BY_ID } from './constants';
