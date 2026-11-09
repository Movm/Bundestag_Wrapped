import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ScrollContainer, type ScrollContainerRef } from '../../src/components/main-wrapped/ScrollContainer';
import { SlideSection } from '../../src/components/main-wrapped/SlideSection';
import { SlideQuiz } from '../../src/components/slides/shared/SlideQuiz';
import '../../src/index.css';

export function Fixture() {
  const [answered, setAnswered] = useState(false);
  const ref = useRef<ScrollContainerRef>(null);
  return <ScrollContainer ref={ref} initialSection={new URLSearchParams(location.search).get('slide')}>
    <SlideSection id="first"><h1>First slide</h1><input aria-label="Text field" /></SlideSection>
    <SlideSection id="quiz" forwardBlocked={!answered}>
      <SlideQuiz quiz={{ question: 'Choose yes', options: ['Yes', 'No'], correctAnswer: 'Yes', explanation: 'A persistent explanation.' }} isAnswered={answered} onAnswer={() => setAnswered(true)} onComplete={() => { throw new Error('Automatic completion'); }} />
    </SlideSection>
    <SlideSection id="long"><div style={{ height: '180vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><h1>Long slide</h1><button>Bottom content</button></div></SlideSection>
    <SlideSection id="last"><h1>Last slide</h1><button onClick={() => ref.current?.scrollToSlide('first')}>Restart</button></SlideSection>
  </ScrollContainer>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
