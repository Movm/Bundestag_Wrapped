import { motion } from 'motion/react';
import type { GenderCheck, GenderDuel, GenderSide } from '@/generated/wrapped-contract-v1';
import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import { consistency, factorTimes, formatFactor, otherSide, partyFactor, SIDE_LABEL, topicShortName } from '@/domain/gender-check';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import { times } from '@/lib/german-count';
import './gender-check.css';

const count = new Intl.NumberFormat('de-DE');

const PARTY_LABEL: Record<string, string> = { 'GRÜNE': 'Grüne', 'DIE LINKE': 'Linke' };
const partyLabel = (party: string) => PARTY_LABEL[party] ?? party;

/** Opener of the chapter. */
export function GenderCheckIntroSlide({ check }: { check: GenderCheck }) {
  const speeches = check.speeches.male + check.speeches.female;
  return (
    <Slide shapes="corner">
      <motion.div variants={ENTER.stamp} className="self-start rotate-[-4deg]">
        <Eyebrow>Gender-Check</Eyebrow>
      </motion.div>
      <Display size="xl" face="wide">Männer gegen <Mark block>Frauen.</Mark></Display>
      <motion.p variants={ENTER.rise} className="ds-statement">
        Reden Männer im Bundestag über andere Dinge als Frauen? Bundestag Wrapped hat {count.format(speeches)} Reden ausgezählt, Fraktion für Fraktion.
      </motion.p>
    </Slide>
  );
}

/** The word duel resolved: factor, one bar per parliamentary group, the top speaker. */
export function GenderWordSlide({ check }: { check: GenderCheck }) {
  const duel = check.wordDuel;
  const winner = SIDE_LABEL[duel.answer];
  const rows = duel.parties.map(row => ({ party: row.party, factor: partyFactor(duel, row) }));
  const finite = rows.map(row => row.factor).filter(Number.isFinite);
  const max = Math.max(1, ...finite);
  return (
    <Slide>
      <Enter><Eyebrow tone="plain" className="ds-gender-label">Auflösung</Eyebrow></Enter>
      <div className="ds-gender-hero">
        <motion.span variants={ENTER.stamp} className={`ds-number ds-gender-hero__factor ds-gender--${duel.answer}`}>{formatFactor(duel.factor)}</motion.span>
        <div className="ds-gender-hero__text">
          <Display size="lg" face="wide" enter="rise">„{duel.term}“</Display>
          <motion.p variants={ENTER.rise} className="ds-lead">
            sagen {winner} so viel öfter als {SIDE_LABEL[otherSide(duel.answer)]}, {consistency(duel.consistentParties, duel.totalParties)}.
          </motion.p>
        </div>
      </div>
      <motion.ol variants={ENTER.rise} className="ds-gender-parties" aria-label={`„${duel.term}“: wie viel öfter ${winner} es sagen, je Fraktion`}>
        {rows.map(row => {
          const value = Number.isFinite(row.factor) ? row.factor : max;
          const label = Number.isFinite(row.factor) ? formatFactor(row.factor) : `nur ${winner}`;
          return (
            <li key={row.party} className="ds-gender-party">
              <span className="ds-gender-party__name">{partyLabel(row.party)}</span>
              <span className="ds-gender-party__track" aria-hidden="true">
                <motion.span variants={ENTER.grow} className={`ds-gender-party__fill ds-gender--${duel.answer}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
              </span>
              <span className="ds-gender-party__value">{label}</span>
            </li>
          );
        })}
      </motion.ol>
      {duel.topSpeaker && (
        <Enter className="ds-gender-speaker">
          <span>Am häufigsten:</span> <b>{duel.topSpeaker.name}</b> <span>{duel.topSpeaker.party} · {times(duel.topSpeaker.count)}</span>
        </Enter>
      )}
    </Slide>
  );
}

function WordColumn({ side, words }: { side: GenderSide; words: GenderCheck['words']['male'] }) {
  const title = side === 'female' ? 'Typisch Rednerin' : 'Typisch Redner';
  return (
    <motion.section variants={ENTER.rise} className={`ds-gender-words__col ds-gender--${side}`} aria-label={`${title}: Wörter, die ${SIDE_LABEL[side]} deutlich öfter sagen`}>
      <h3 className="ds-gender-key">{title}</h3>
      <ol className="ds-gender-words__list">
        {words.map(word => (
          <li key={word.word}>
            <span className="ds-gender-words__word">{word.word}</span>
            <span className="ds-gender-words__factor"><span className="sr-only">{factorTimes(word.factor)} so oft</span><span aria-hidden="true">{formatFactor(word.factor)}</span></span>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

/** Typical nouns of each side, the party mix taken out. */
export function GenderWordsSlide({ check }: { check: GenderCheck }) {
  return (
    <Slide>
      <Enter><Eyebrow tone="plain" className="ds-gender-label">Top-Wörter</Eyebrow></Enter>
      <Display size="lg" face="wide">Typisch <span className="ds-gender--female ds-gender-text">Rednerin</span>, typisch <span className="ds-gender--male ds-gender-text">Redner.</span></Display>
      <div className="ds-gender-words">
        <WordColumn side="female" words={check.words.female} />
        <WordColumn side="male" words={check.words.male} />
      </div>
      <Note>Wie viel öfter ein Wort fällt, bei gleichem Fraktionsmix. Nur Wörter, bei denen es in mindestens vier Fraktionen so ist.</Note>
    </Slide>
  );
}

function topicName(topic: string): string {
  return TOPIC_BY_ID[topic] ? topicShortName(topic) : topic;
}

/** The topic duel resolved: every topic as a bar to the women's or the men's side. */
export function GenderTopicsSlide({ check }: { check: GenderCheck }) {
  const duel: GenderDuel = check.topicDuel;
  // Only differences that hold in at least four of the five groups, like the duels.
  const rows = check.topics.filter(topic => topic.consistentParties >= 4);
  const max = Math.max(0.01, ...rows.map(row => row.factor - 1));
  const name = topicName(duel.term);
  return (
    <Slide>
      <Enter><Eyebrow tone="plain" className="ds-gender-label">Auflösung · Themen</Eyebrow></Enter>
      <Display size="lg" face="wide">{name} ist <Mark block>{duel.answer === 'male' ? 'Männersache.' : 'Frauensache.'}</Mark></Display>
      <motion.table variants={ENTER.rise} className="ds-gender-topics">
        <caption className="sr-only">Themen nach Geschlecht: wer mehr darüber redet, wie viel mehr und in wie vielen Fraktionen</caption>
        <thead>
          <tr>
            <th scope="col" className="ds-gender-topics__side"><span className="ds-gender-key ds-gender--female">Frauen reden mehr</span></th>
            <th scope="col"><span className="sr-only">Thema</span></th>
            <th scope="col" className="ds-gender-topics__side ds-gender-topics__side--male"><span className="ds-gender-key ds-gender--male">Männer reden mehr</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const bar = (side: GenderSide) => row.side === side ? (
              <span className={`ds-gender-topics__row ds-gender-topics__row--${side}`}>
                <motion.span variants={ENTER.grow} aria-hidden="true" className={`ds-gender-topics__bar ds-gender--${side}`} style={{ width: `calc(${(row.factor - 1) / max} * (100% - 3.75rem))` }} />
                <span className="ds-gender-topics__value">{formatFactor(row.factor)}</span>
              </span>
            ) : null;
            return (
              <tr key={row.topic} data-duel={row.topic === duel.term || undefined}>
                <td className="ds-gender-topics__cell ds-gender-topics__cell--female">{bar('female')}</td>
                <th scope="row" className="ds-gender-topics__name">
                  {topicName(row.topic)}
                  <small>{row.consistentParties}/{check.totalParties}<span className="ds-gender-topics__unit"> Fraktionen</span></small>
                </th>
                <td className="ds-gender-topics__cell">{bar('male')}</td>
              </tr>
            );
          })}
        </tbody>
      </motion.table>
      <Note>Wie viel öfter die Wörter eines Themas fallen, bei gleichem Fraktionsmix. Nur Themen, bei denen es in mindestens vier Fraktionen so ist.</Note>
    </Slide>
  );
}
