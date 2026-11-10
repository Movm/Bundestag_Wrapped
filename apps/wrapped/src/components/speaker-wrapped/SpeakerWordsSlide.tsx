import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { Slide } from '@/design-system/components/Slide';
import { Display, Lead, Mark } from '@/design-system/components/Type';
import { ChipCloud } from '@/design-system/components/Data';
import { signatureWordsForDisplay } from '@/lib/speaker-profile-utils';
import './speaker.css';

interface SpeakerWordsSlideProps {
  speaker: SpeakerWrapped;
}

/** Favourite words (by count) and signature words (by ratio to the Bundestag average) as word chips. */
export function SpeakerWordsSlide({ speaker }: SpeakerWordsSlideProps) {
  const topWords = speaker.words.topWords.slice(0, 6).map(word => `${word.word} ${word.count}×`);
  // Bundestag comparison shows what makes this speaker unique nationally.
  const signatureWords = signatureWordsForDisplay(speaker).map(word => `${word.word} ${(word.ratio ?? 0).toFixed(1)}×`);

  return (
    <Slide shapes="orbit">
      <div className="sp-split">
        <div>
          <Display size="lg">Deine <Mark>Lieblings&shy;wörter</Mark></Display>
          <Lead>Die häufigsten Begriffe in deinen Reden.</Lead>
          <ChipCloud words={topWords} label="Lieblingswörter mit Anzahl" />
        </div>
        {signatureWords.length > 0 && (
          <div>
            <Display size="lg">Deine <Mark>Signature Words</Mark></Display>
            <Lead>Wörter, die du häufiger nutzt als der Bundestag-Durchschnitt.</Lead>
            <ChipCloud words={signatureWords} label="Signature Words mit Faktor gegenüber dem Durchschnitt" />
          </div>
        )}
      </div>
    </Slide>
  );
}
