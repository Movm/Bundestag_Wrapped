import { useRef, useState } from 'react';
import { motion, type PanInfo } from 'motion/react';
import { ENTER } from '@/design-system/motion';
import { ArrowIcon } from '@/components/mdb-profile/shared';
import { topicName } from '@/lib/perfect-match';

export type Slots = [string | null, string | null, string | null];

/**
 * Step 2: drag topic chips into three ranked slots, or tap a chip to fill the
 * next free slot. The chip follows the finger as a transform; slot rectangles
 * are measured once at drag start, and React re-renders only when the hovered
 * slot changes or the chip lands.
 */
export function TopicsStep({ topics, slots, onChange, onDone }: { topics: string[]; slots: Slots; onChange: (slots: Slots) => void; onDone: () => void }) {
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rects = useRef<DOMRect[]>([]);
  const hoverRef = useRef(-1);
  const dragged = useRef(false);
  const [hover, setHover] = useState(-1);
  const [dragging, setDragging] = useState<string | null>(null);
  const complete = slots.every(Boolean);

  const place = (topic: string, slot: number) => {
    const target = slot >= 0 ? slot : slots.indexOf(null);
    if (target < 0) return;
    const next = slots.map(value => (value === topic ? null : value)) as Slots;
    next[target] = topic;
    onChange(next);
  };

  const hitTest = (info: PanInfo) => {
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    return rects.current.findIndex(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  };

  const setHoverOnChange = (index: number) => {
    if (hoverRef.current === index) return;
    hoverRef.current = index;
    setHover(index);
  };

  return (
    <>
      <motion.h1 variants={ENTER.rise} className="pm__title">Deine 3 wichtigsten Themen?</motion.h1>
      <motion.div variants={ENTER.slide} className="pm-slots" role="list" aria-label="Deine Top 3 Themen">
        {slots.map((topic, index) => (
          <div role="listitem" key={index} className="flex">
            <button
              type="button"
              ref={el => { slotRefs.current[index] = el; }}
              className="pm-slot w-full"
              data-filled={Boolean(topic)}
              data-hover={hover === index}
              disabled={!topic}
              aria-label={topic ? `Platz ${index + 1}: ${topicName(topic)}, antippen zum Leeren` : `Platz ${index + 1}: leer`}
              onClick={() => { if (topic) onChange(slots.map((value, i) => (i === index ? null : value)) as Slots); }}
            >
              <span className="pm-slot__num" aria-hidden="true">{index + 1}</span>
              <span className="pm-slot__label">{topic ? topicName(topic) : ''}</span>
            </button>
          </div>
        ))}
      </motion.div>
      <div className="pm-divider" aria-hidden="true" />
      <ul className="pm-bank" aria-label="Themen zur Auswahl">
        {topics.map(topic => {
          const used = slots.includes(topic);
          return (
            <motion.li key={topic} className="pm-bank__well" variants={ENTER.pop}>
              <motion.button
                type="button"
                className="pm-chip"
                data-used={used}
                data-dragging={dragging === topic}
                disabled={used}
                aria-label={`${topicName(topic)} auf den nächsten freien Platz legen`}
                drag={!used}
                dragSnapToOrigin
                dragMomentum={false}
                whileDrag={{ scale: 1.08, rotate: -4 }}
                onDragStart={() => {
                  dragged.current = true;
                  rects.current = slotRefs.current.map(el => el?.getBoundingClientRect() ?? new DOMRect());
                  setDragging(topic);
                }}
                onDrag={(_, info) => setHoverOnChange(hitTest(info))}
                onDragEnd={(_, info) => {
                  const target = hitTest(info);
                  setHoverOnChange(-1);
                  setDragging(null);
                  if (target >= 0) place(topic, target);
                }}
                onClick={() => {
                  if (dragged.current) { dragged.current = false; return; }
                  place(topic, -1);
                }}
              >
                {topicName(topic)}
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
      <div className="pm__actions">
        <button type="button" className="mp-btn mp-btn--pink mp-btn--lg" disabled={!complete} onClick={onDone}>Weiter<ArrowIcon /></button>
        <p className="pm__note">{complete ? 'Antippen leert einen Platz.' : 'Ziehen oder antippen.'}</p>
      </div>
    </>
  );
}
