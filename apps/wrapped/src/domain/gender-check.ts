import type { GenderDuel, GenderSide } from '@/generated/wrapped-contract-v1';
import type { QuizQuestion } from '@/data/wrapped';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import { cardinal } from '@/lib/german-count';

/**
 * Männer gegen Frauen: the gender check chapter. The edition's `genderCheck`
 * section compares formal speeches at the same party mix (see
 * services/analysis/.../edition/gender_check.py), so a difference never only
 * says that one group sits mostly in one parliamentary group.
 */

export const SIDE_LABEL: Record<GenderSide, 'Männer' | 'Frauen'> = { male: 'Männer', female: 'Frauen' };
/** Answer order on the duel: Männer left, Frauen right — never shuffled. */
export const DUEL_OPTIONS = [SIDE_LABEL.male, SIDE_LABEL.female] as const;

/** A duel is only asked when it holds in at least four of the five groups. */
const MIN_CONSISTENT = 4;

const decimal = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

export const formatFactor = (factor: number) => `${decimal.format(factor)}×`;

/** "2,5-mal" */
export const factorTimes = (factor: number) => `${decimal.format(factor)}-mal`;

export const otherSide = (side: GenderSide): GenderSide => (side === 'male' ? 'female' : 'male');

/** "in allen fünf Fraktionen" / "in vier von fünf Fraktionen" */
export function consistency(consistent: number, total: number): string {
  return consistent === total ? `in allen ${cardinal(total)} Fraktionen` : `in ${cardinal(consistent)} von ${cardinal(total)} Fraktionen`;
}

/** "Klima & Umwelt" → "Klima", "Europa/Außen" → "Europa": the short form reads in a question. */
export function topicShortName(topic: string): string {
  const name = TOPIC_BY_ID[topic]?.name ?? topic;
  return name.split(/\s*[&/]\s*/)[0];
}

/** Factor of one party towards the duel's answer side; below 1 when the party points the other way. */
export function partyFactor(duel: GenderDuel, row: GenderDuel['parties'][number]): number {
  const [winner, loser] = duel.answer === 'female' ? [row.female, row.male] : [row.male, row.female];
  return loser > 0 ? winner / loser : winner > 0 ? Infinity : 1;
}

function duelQuestion(id: string, duel: GenderDuel | undefined, text: (duel: GenderDuel) => string, claim: (duel: GenderDuel) => string): QuizQuestion | undefined {
  if (!duel || duel.consistentParties < MIN_CONSISTENT) return undefined;
  return {
    id,
    type: 'prediction',
    question: text(duel),
    options: [...DUEL_OPTIONS],
    correctAnswer: SIDE_LABEL[duel.answer],
    explanation: `${claim(duel)} ${SIDE_LABEL.female} ${duel.split.female} %, ${SIDE_LABEL.male} ${duel.split.male} %.`,
    layout: 'duel',
    optionShares: { [SIDE_LABEL.male]: duel.split.male, [SIDE_LABEL.female]: duel.split.female },
  };
}

/** "Wer sagt im Bundestag öfter „Männer“?" */
export function genderWordQuestion(duel: GenderDuel | undefined): QuizQuestion | undefined {
  return duelQuestion(
    'quiz-gender-word',
    duel,
    d => `Wer sagt im Bundestag öfter „${d.term}“?`,
    d => `${SIDE_LABEL[d.answer]} sagen „${d.term}“ ${factorTimes(d.factor)} so oft wie ${SIDE_LABEL[otherSide(d.answer)]}, ${consistency(d.consistentParties, d.totalParties)}.`,
  );
}

/** "Wer redet mehr über Klima?" */
export function genderTopicQuestion(duel: GenderDuel | undefined): QuizQuestion | undefined {
  return duelQuestion(
    'quiz-gender-topic',
    duel,
    d => `Wer redet mehr über ${topicShortName(d.term)}?`,
    d => `${SIDE_LABEL[d.answer]} reden ${factorTimes(d.factor)} so viel über ${topicShortName(d.term)} wie ${SIDE_LABEL[otherSide(d.answer)]}, ${consistency(d.consistentParties, d.totalParties)}.`,
  );
}
