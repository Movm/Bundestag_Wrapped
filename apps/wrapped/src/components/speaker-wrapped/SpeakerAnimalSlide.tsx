import { motion } from 'motion/react';
import type { SpeakerWrapped } from '@/data/speaker-wrapped';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Lead } from '@/design-system/components/Type';
import { RankCard } from '@/design-system/components/Data';
import { ENTER } from '@/design-system/motion';
import './speaker.css';

interface SpeakerAnimalSlideProps {
  speaker: SpeakerWrapped;
}

/** Spirit animal: the winner as huge name plus emoji, runners-up as stair-stepped cards. */
export function SpeakerAnimalSlide({ speaker }: SpeakerAnimalSlideProps) {
  const { spiritAnimal } = speaker;
  if (!spiritAnimal) return null;

  const alternatives = (spiritAnimal.alternatives ?? []).slice(0, 2);

  return (
    <Slide shapes="corner">
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Dein Bundestag-Tier</Eyebrow>
      </motion.div>
      <div className="sp-animal">
        <div className="flex min-w-0 flex-col gap-[clamp(1rem,0.6rem+1.6vw,2rem)]">
          <motion.span variants={ENTER.pop} className="sp-animal__emoji" aria-hidden="true">{spiritAnimal.emoji}</motion.span>
          <Display size="xl">{spiritAnimal.name}</Display>
          <Lead>{spiritAnimal.title}. {spiritAnimal.reason}</Lead>
        </div>
        {alternatives.length > 0 && (
          <div className="sp-animal__list">
            {alternatives.map((animal, index) => (
              <RankCard key={animal.name} rank={index + 2} label={animal.name} detail={animal.title} tone={index === 0 ? 'white' : 'pink'} step={index + 1} />
            ))}
          </div>
        )}
      </div>
    </Slide>
  );
}
