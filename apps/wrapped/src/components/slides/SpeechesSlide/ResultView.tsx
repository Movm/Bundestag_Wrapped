import { memo } from 'react';
import { motion } from 'motion/react';
import { getPartyTone } from '@/lib/party-colors';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import './speeches.css';

interface PartyWithTotals {
  party: string;
  speeches: number;
  wortbeitraege: number;
  totalBeitraege: number;
}

interface ResultViewProps {
  parties: PartyWithTotals[];
}

const format = (value: number) => value.toLocaleString('de-DE');

export const ResultView = memo(function ResultView({ parties }: ResultViewProps) {
  const top5 = parties.slice(0, 5);
  const totalReden = top5.reduce((sum, p) => sum + p.speeches, 0);
  const max = Math.max(1, ...top5.map(p => Math.max(p.speeches, p.wortbeitraege)));

  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Wir unterscheiden zwischen richtigen Reden und weiteren Wortbeiträgen (Fragestunden oder Ähnliches).</Note>}
    >
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Die Reden</Eyebrow></Enter>
        <Display size="xl" face="wide">
          <Mark>{format(totalReden)}</Mark> formelle Reden.
        </Display>
      </div>
      <Enter>
        <table className="speeches-chart">
          <caption className="sr-only">Reden und weitere Wortbeiträge je Fraktion</caption>
          <thead className="sr-only">
            <tr><th scope="col">Fraktion</th><th scope="col">Balken</th><th scope="col">Reden und weitere Wortbeiträge</th></tr>
          </thead>
          <tbody>
            {top5.map(party => (
              <tr key={party.party}>
                <th scope="row">{party.party}</th>
                <td className="speeches-chart__track" aria-hidden="true">
                  <div className="speeches-chart__bars">
                    <motion.span
                      className="speeches-chart__bar"
                      variants={ENTER.grow}
                      style={{ width: `${(party.speeches / max) * 100}%`, '--bar': getPartyTone(party.party, 'dark') } as React.CSSProperties}
                    />
                    <motion.span
                      className="speeches-chart__bar speeches-chart__bar--minor"
                      variants={ENTER.grow}
                      style={{ width: `${(party.wortbeitraege / max) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="speeches-chart__value">
                  {format(party.speeches)} <span className="sr-only">Reden, </span>
                  <small>{format(party.wortbeitraege)} <span className="sr-only">weitere </span>Wortbeiträge</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Enter>
      <ul className="speeches-legend" aria-hidden="true">
        <li><i style={{ background: 'var(--surface-on)' }} />Reden (Farbbalken)</li>
        <li><i style={{ background: 'var(--surface-track)' }} />Weitere Wortbeiträge</li>
      </ul>
    </Slide>
  );
});
