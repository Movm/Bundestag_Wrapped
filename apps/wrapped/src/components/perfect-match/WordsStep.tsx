import { useMemo, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { ENTER } from '@/design-system/motion';
import { ArrowIcon } from '@/components/mdb-profile/shared';
import type { MatchWord } from '@/lib/perfect-match';
import { playSound } from '@/lib/sounds';

export const MAX_WORDS = 3;
const PICK_COLORS = [['var(--color-wr-pink)', 'var(--color-wr-ink)'], ['var(--color-wr-violet)', '#fff'], ['var(--color-wr-mint)', 'var(--color-wr-ink)']];

/** Step 3: pick up to three words. Plain toggles; the tilt is a CSS transition. */
export function WordsStep({ words, picked, onChange, onDone }: { words: MatchWord[]; picked: string[]; onChange: (picked: string[]) => void; onDone: () => void }) {
  const full = picked.length >= MAX_WORDS;
  // The pipeline lists words grouped by party; alphabetical order hides the lean.
  const sorted = useMemo(() => [...words].sort((a, b) => a.word.localeCompare(b.word, 'de')), [words]);
  return (
    <>
      <motion.div variants={ENTER.rise} className="pm-words__head">
        <h1 className="pm__title max-w-[56rem]">Für welche Worte soll dein Match stehen?</h1>
        <p className="pm-words__count m-0" aria-live="polite" aria-label={`${picked.length} von ${MAX_WORDS} Wörtern gewählt`}>{picked.length}<span>/{MAX_WORDS}</span></p>
      </motion.div>
      <ul className="pm-words" aria-label="Wörter aus den Reden">
        {sorted.map((item, index) => {
          const position = picked.indexOf(item.word);
          const on = position >= 0;
          const [pick, ink] = PICK_COLORS[position] ?? PICK_COLORS[0];
          return (
            <motion.li key={item.word} variants={ENTER.slide}>
              <button
                type="button"
                lang="de"
                className="pm-word"
                aria-pressed={on}
                disabled={!on && full}
                style={{ '--pm-pick': pick, '--pm-pick-ink': ink, '--pm-tilt': index % 2 ? '1.5deg' : '-1.5deg' } as CSSProperties}
                onClick={() => { playSound('click'); onChange(on ? picked.filter(word => word !== item.word) : [...picked, item.word]); }}
              >
                <span className="pm-word__label">{item.word}</span>
                <span className="pm-word__mark" aria-hidden="true">{on ? position + 1 : '+'}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      <div className="pm__actions">
        <button type="button" className="mp-btn mp-btn--pink mp-btn--lg" disabled={picked.length !== MAX_WORDS} onClick={onDone}>Match finden<ArrowIcon /></button>
        <p className="pm__note">Die Wörter stammen aus den Reden: Sie trennen die Fraktionen am deutlichsten.</p>
      </div>
    </>
  );
}
