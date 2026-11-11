import { type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { ENTER } from '@/design-system/motion';
import { ArrowIcon } from '@/components/mdb-profile/shared';
import type { MatchAnimal } from '@/lib/perfect-match';
import { playSound } from '@/lib/sounds';

const PICK_COLORS = [['var(--color-wr-violet)', '#fff'], ['var(--color-wr-pink)', 'var(--color-wr-ink)'], ['#fff', 'var(--color-wr-ink)'], ['var(--color-wr-mint)', 'var(--color-wr-ink)']];

/** Step 4: pick one spirit animal. Native radios, so arrow keys move the choice. */
export function AnimalStep({ animals, picked, onChange, onDone }: { animals: MatchAnimal[]; picked: string | null; onChange: (id: string) => void; onDone: () => void }) {
  return (
    <>
      <motion.h1 variants={ENTER.rise} className="pm__title" id="pm-animal-title">Welches Tier bist du?</motion.h1>
      <div role="radiogroup" aria-labelledby="pm-animal-title" className="pm-animals">
        {animals.map((animal, index) => {
          const [pick, ink] = PICK_COLORS[index % PICK_COLORS.length];
          return (
            <motion.label
              key={animal.id}
              variants={ENTER.slide}
              className="pm-animal"
              data-on={picked === animal.id}
              style={{ '--pm-pick': pick, '--pm-pick-ink': ink, '--pm-tilt': index % 2 ? '1.2deg' : '-1.2deg' } as CSSProperties}
            >
              <input
                type="radio"
                name="pm-animal"
                value={animal.id}
                className="pm-sr"
                checked={picked === animal.id}
                onChange={() => { playSound('click'); onChange(animal.id); }}
              />
              <span className="pm-animal__emoji" aria-hidden="true">{animal.emoji}</span>
              <span className="pm-animal__body">
                <span className="pm-animal__name" lang="de">{animal.name}</span>
                {animal.title && <span className="pm-animal__title">{animal.title}</span>}
                {animal.text && <span className="pm-animal__text">{animal.text}</span>}
              </span>
            </motion.label>
          );
        })}
      </div>
      <div className="pm__actions">
        <button type="button" className="mp-btn mp-btn--pink mp-btn--lg" disabled={!picked} onClick={onDone}>Match finden<ArrowIcon /></button>
        <p className="pm__note">Die Tiere stammen aus den Abgeordneten-Profilen, berechnet aus den Reden.</p>
      </div>
    </>
  );
}
