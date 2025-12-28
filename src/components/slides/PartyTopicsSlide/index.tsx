import { memo } from 'react';
import type { TopicAnalysis } from '@/data/wrapped';
import { ResultView } from './ResultView';

interface PartyTopicsSlideProps {
  topicAnalysis: TopicAnalysis;
}

export const PartyTopicsSlide = memo(function PartyTopicsSlide({
  topicAnalysis,
}: PartyTopicsSlideProps) {
  return <ResultView topicAnalysis={topicAnalysis} />;
});
