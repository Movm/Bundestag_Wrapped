import { motion } from 'motion/react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow } from '@/design-system/components/Type';
import { ActionButton } from '@/design-system/components/ActionButton';
import { ENTER } from '@/design-system/motion';
import { getPartyTone } from '@/lib/party-colors';
import { playSound } from '@/lib/sounds';
import { displaySpeakerName } from '@/lib/speaker-profile-utils';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';
import './speaker.css';

interface SpeakerIntroSlideProps {
  speaker: SpeakerWrapped;
  onStart?: () => void;
}

/** Speaker cover: huge name, party pill, start button (unlocks the scroll). */
export function SpeakerIntroSlide({ speaker, onStart }: SpeakerIntroSlideProps) {
  const surface = editionSurface(useOptionalEdition());

  const handleStart = () => {
    playSound('click');
    onStart?.();
  };

  return (
    <Slide shapes="cover">
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Dein {surface.title}</Eyebrow>
      </motion.div>
      <Display level={1} size="xl">{displaySpeakerName(speaker)}</Display>
      <motion.span variants={ENTER.pop} className="sp-party" style={{ background: getPartyTone(speaker.party, 'light') }}>
        {speaker.party}
      </motion.span>
      <motion.div variants={ENTER.rise}>
        <ActionButton size="lg" icon="right" onClick={handleStart}>Los geht's</ActionButton>
      </motion.div>
    </Slide>
  );
}
