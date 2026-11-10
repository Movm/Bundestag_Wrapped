import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { motion, Reorder } from 'motion/react';
import { ENTER } from '@/design-system/motion';
import { getPartyTone } from '@/lib/party-colors';
import { ArrowIcon } from '@/components/mdb-profile/shared';
import { playSound } from '@/lib/sounds';

const LABEL: Record<string, string> = { 'CDU/CSU': 'CDU/CSU', SPD: 'SPD', GRÜNE: 'Grüne', 'DIE LINKE': 'Linke' };

function Grip() {
  return <span className="pm-grip" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</span>;
}

/**
 * Step 1: drag the parties into order. Reorder moves the dragged card with a
 * motion value and the others with layout transforms, so React only renders
 * when the order actually changes. Arrow keys move the focused card.
 */
export function RankStep({ order, onChange, onDone }: { order: string[]; onChange: (order: string[]) => void; onDone: () => void }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const move = (party: string, by: number, event: KeyboardEvent<HTMLLIElement>) => {
    const from = order.indexOf(party);
    const to = from + by;
    if (to < 0 || to >= order.length) return;
    event.preventDefault();
    const next = order.slice();
    next.splice(from, 1);
    next.splice(to, 0, party);
    playSound('tick');
    onChange(next);
    setAnnounce(`${LABEL[party] ?? party} jetzt auf Platz ${to + 1}`);
    requestAnimationFrame(() => (event.target as HTMLElement).focus());
  };

  return (
    <div className="pm-rank">
      <motion.div variants={ENTER.rise} className="pm-rank__intro">
        <h1 className="pm__title">Wer steht dir am nächsten?</h1>
        <p className="pm__hint">Zieh die Fraktionen in deine Reihenfolge. Mit der Tastatur: Karte fokussieren, dann Pfeil hoch oder runter.</p>
        <button type="button" className="mp-btn mp-btn--pink mp-btn--lg" onClick={onDone}>Passt so<ArrowIcon /></button>
      </motion.div>
      <motion.div variants={ENTER.slide}>
        <Reorder.Group as="ol" axis="y" values={order} onReorder={next => { playSound('tick'); onChange(next); }} className="pm-rank__list" aria-label="Deine Reihenfolge der Fraktionen">
          {order.map((party, index) => (
            <Reorder.Item
              key={party}
              value={party}
              tabIndex={0}
              className="pm-rank__item"
              style={{ '--pm-party': getPartyTone(party, 'dark') } as CSSProperties}
              data-dragging={dragging === party}
              aria-label={`${LABEL[party] ?? party}, Platz ${index + 1} von ${order.length}`}
              whileDrag={{ scale: 1.04, rotate: -1.5 }}
              onDragStart={() => { playSound('lift'); setDragging(party); }}
              onDragEnd={() => setDragging(null)}
              onKeyDown={event => {
                if (event.key === 'ArrowUp') move(party, -1, event);
                if (event.key === 'ArrowDown') move(party, 1, event);
              }}
            >
              <span className="pm-rank__place" aria-hidden="true">{index + 1}</span>
              <span className="pm-rank__label">{LABEL[party] ?? party}</span>
              <Grip />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </motion.div>
      <p className="pm-sr" aria-live="polite">{announce}</p>
    </div>
  );
}
