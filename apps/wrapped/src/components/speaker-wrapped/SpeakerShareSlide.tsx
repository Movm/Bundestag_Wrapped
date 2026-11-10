import { memo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Download, Share2, RotateCcw, Users, Home } from 'lucide-react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { Slide } from '@/design-system/components/Slide';
import { Display, Mark } from '@/design-system/components/Type';
import { ActionButton } from '@/design-system/components/ActionButton';
import { ENTER } from '@/design-system/motion';
import {
  preloadLogo,
  renderSpeakerShareImage,
  downloadSpeakerShareImage,
  shareSpeakerImage,
  type SpeakerShareData,
} from '@/lib/speaker-share-canvas';
import { signatureWordsForDisplay } from '@/lib/speaker-profile-utils';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionShareUrl, editionSurface } from '@/edition/surface';
import './speaker.css';

interface SpeakerShareSlideProps {
  speaker: SpeakerWrapped;
  onRestart?: () => void;
}

function toShareData(data: SpeakerWrapped, wordIndex: number, editionTitle: string, editionId: string): SpeakerShareData {
  // Bundestag comparison shows national uniqueness.
  const sigWord = signatureWordsForDisplay(data)[wordIndex];
  return {
    name: data.name,
    party: data.party,
    spiritAnimal: data.spiritAnimal
      ? {
          emoji: data.spiritAnimal.emoji,
          name: data.spiritAnimal.name,
          title: data.spiritAnimal.title,
          reason: data.spiritAnimal.reason,
        }
      : null,
    signatureWord: sigWord ? { word: sigWord.word, count: sigWord.count, ratio: sigWord.ratio ?? 0 } : null,
    editionTitle,
    editionId,
  };
}

/** Share slide (pink): canvas preview, signature-word picker, save/share and navigation. */
export const SpeakerShareSlide = memo(function SpeakerShareSlide({ speaker, onRestart }: SpeakerShareSlideProps) {
  const surface = editionSurface(useOptionalEdition());
  const [canShare, setCanShare] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureWords = signatureWordsForDisplay(speaker);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    preloadLogo().then(() => {
      if (canvasRef.current) {
        renderSpeakerShareImage(canvasRef.current, toShareData(speaker, selectedWordIndex, surface.title, surface.editionId));
      }
    });
  }, [speaker, selectedWordIndex, surface.editionId, surface.title]);

  const handleDownload = () => {
    if (canvasRef.current) downloadSpeakerShareImage(canvasRef.current, speaker.name, surface.editionId);
  };

  const handleShare = async () => {
    if (canvasRef.current) {
      await shareSpeakerImage(canvasRef.current, speaker.name, surface.title, surface.editionId, editionShareUrl(surface, `wrapped/${speaker.slug}`));
    }
  };

  return (
    <Slide shapes="ring">
      <div className="sp-share">
        <motion.div variants={ENTER.pop} className="sp-share__canvas">
          <canvas ref={canvasRef} role="img" aria-label={`Sharepic für ${speaker.name}`} />
        </motion.div>

        <div className="sp-share__controls">
          <Display size="lg">Teile dein <Mark>Ergebnis</Mark></Display>

          {signatureWords.length > 1 && (
            <motion.div variants={ENTER.rise}>
              <p id="sp-word-pick-label" className="ds-note mb-2 font-bold">Wähle dein Signaturwort</p>
              <ul className="sp-word-pick" aria-labelledby="sp-word-pick-label">
                {signatureWords.map((word, index) => (
                  <li key={word.word}>
                    <button type="button" aria-pressed={index === selectedWordIndex} onClick={() => setSelectedWordIndex(index)}>
                      {word.word} {(word.ratio ?? 0).toFixed(1)}×
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div variants={ENTER.rise} className="sp-share__row">
            <ActionButton icon="none" onClick={handleDownload}><Download size={20} aria-hidden="true" />Speichern</ActionButton>
            {canShare && <ActionButton icon="none" variant="outline" onClick={handleShare}><Share2 size={20} aria-hidden="true" />Teilen</ActionButton>}
          </motion.div>

          <motion.div variants={ENTER.rise} className="sp-share__row">
            <button type="button" className="ds-icon-button" onClick={onRestart} aria-label="Nochmal ansehen">
              <RotateCcw size={20} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <Link to={editionPath(surface, 'abgeordnete')} className="ds-icon-button" aria-label="Andere Abgeordnete anzeigen">
              <Users size={20} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <Link to={editionPath(surface)} className="ds-icon-button" aria-label="Zur Startseite">
              <Home size={20} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </Slide>
  );
});
