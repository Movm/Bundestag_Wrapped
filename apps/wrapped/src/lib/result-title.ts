/**
 * The quiz result title and line. One table for the sharepic and the finale, so
 * a player never gets two different names for the same score.
 */
export interface ResultTitle {
  title: string;
  line: string;
}

const EXPLORER = 'Auf Entdeckungstour';
const EYE = 'Mit Blick fürs Plenum';
const REGULAR = 'Stammgast im Plenum';
const PRO = 'Parlamentsprofi';

/** The 2026 edition's five questions, line by line. */
const FIVE_QUESTIONS: readonly ResultTitle[] = [
  { title: EXPLORER, line: 'Der Bundestag hatte ein paar Überraschungen für dich.' },
  { title: EXPLORER, line: 'Ein Treffer. Und ein paar Geschichten fürs nächste Gespräch.' },
  { title: EYE, line: 'Zwei Treffer – du bist einigen auf die Spur gekommen.' },
  { title: REGULAR, line: 'Mehr als die Hälfte richtig. Du hast ein Gespür dafür.' },
  { title: PRO, line: 'Fast alles gewusst. Was war bei der einen Frage los?' },
  { title: PRO, line: 'Alles richtig. Du hast doch heimlich die Protokolle gelesen.' },
];

/** Any other number of questions: same titles by share, lines without counts. */
function byShare(correct: number, total: number): ResultTitle {
  const share = correct / total;
  if (share <= 0.2) {
    return { title: EXPLORER, line: correct === 0 ? FIVE_QUESTIONS[0].line : 'Ein paar Geschichten fürs nächste Gespräch.' };
  }
  if (share <= 0.4) return { title: EYE, line: 'Du bist einigen auf die Spur gekommen.' };
  if (share <= 0.6) return { title: REGULAR, line: 'Du hast ein Gespür dafür.' };
  if (correct >= total) return { title: PRO, line: FIVE_QUESTIONS[5].line };
  return { title: PRO, line: `Fast alles gewusst. Was war ${total - correct === 1 ? 'bei der einen Frage' : 'bei den anderen Fragen'} los?` };
}

export function resultTitle(correct: number, total: number): ResultTitle | null {
  if (total <= 0) return null;
  const clamped = Math.min(Math.max(Math.round(correct), 0), total);
  return total === 5 ? FIVE_QUESTIONS[clamped] : byShare(clamped, total);
}
