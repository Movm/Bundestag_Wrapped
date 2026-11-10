import type { SignatureWord, SpeakerWrapped } from '@/data/speaker-wrapped';
import { hashSeed } from '@/design-system/quiz/layouts';
import { displaySpeakerName } from '@/lib/speaker-profile-utils';

/**
 * The signature-word quiz of one MP, built only from that MP's exported
 * ratios. Rounds whose data is missing are left out, so a quiz has 2 to 4
 * rounds; with fewer than 2 there is no quiz.
 */

export interface MdbQuizWord {
  word: string;
  /** How many times more often than the Bundestag average. */
  bundestag: number | null;
  /** How many times more often than the own faction. */
  party: number | null;
}

interface RoundBase {
  id: string;
  scope: 'bundestag' | 'party';
  question: string;
  word: MdbQuizWord;
}

export interface MdbPickRound extends RoundBase {
  kind: 'pick';
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

export interface MdbEstimateRound extends RoundBase {
  kind: 'estimate';
  answer: number;
  max: number;
}

export type MdbQuizRound = MdbPickRound | MdbEstimateRound;

export interface MdbQuiz {
  firstName: string;
  party: string;
  rounds: MdbQuizRound[];
  /** Every signature word with both ratios, for the final table. */
  words: MdbQuizWord[];
}

export const MIN_QUIZ_ROUNDS = 2;
/** The faction factor must differ from 1 by this much, or "more or less often" has no clear answer. */
const MIN_FACTION_GAP = 0.15;

const TITLE_RE = /^(?:(?:Prof\.?|Dr\.?)\s+)+/i;

export function firstName(speaker: Pick<SpeakerWrapped, 'name' | 'academicTitle'>): string {
  return displaySpeakerName(speaker).replace(TITLE_RE, '').split(/\s+/)[0] ?? '';
}

export function formatRatio(value: number): string {
  return `${value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`;
}

function ratioOf(word: SignatureWord, key: 'ratioBundestag' | 'ratioParty'): number | null {
  const value = word.ratio ?? word[key];
  return typeof value === 'number' && value > 0 ? value : null;
}

/** Signature words of both comparisons, merged by word, strongest Bundestag ratio first. */
export function quizWords(speaker: SpeakerWrapped): MdbQuizWord[] {
  const byWord = new Map<string, MdbQuizWord>();
  const entry = (word: string) => byWord.get(word) ?? byWord.set(word, { word, bundestag: null, party: null }).get(word)!;
  for (const word of speaker.words.signatureWordsBundestag ?? []) entry(word.word).bundestag = ratioOf(word, 'ratioBundestag');
  for (const word of speaker.words.signatureWordsParty ?? []) entry(word.word).party = ratioOf(word, 'ratioParty');
  return [...byWord.values()].sort((a, b) => (b.bundestag ?? 0) - (a.bundestag ?? 0) || (b.party ?? 0) - (a.party ?? 0));
}

/** Frequent words of the MP that are not signature words: plausible, but wrong. */
function distractors(speaker: SpeakerWrapped, exclude: Set<string>, count: number): string[] {
  const signature = new Set([
    ...(speaker.words.signatureWordsBundestag ?? []),
    ...(speaker.words.signatureWordsParty ?? []),
    ...(speaker.words.signatureWords ?? []),
  ].map(word => word.word.toLowerCase()));
  const pool = [
    ...speaker.words.topWords.map(word => word.word.toLowerCase()),
    ...(speaker.signatureQuiz?.options.filter(option => !option.isCorrect).map(option => option.text.toLowerCase()) ?? []),
  ];
  const picked: string[] = [];
  for (const word of pool) {
    if (picked.length === count) break;
    if (word.length < 4 || signature.has(word) || exclude.has(word) || picked.includes(word)) continue;
    picked.push(word);
  }
  return picked;
}

/** Deterministic order per MP and round, so a reload shows the same quiz. */
function shuffled<T>(items: T[], seed: string): T[] {
  return items
    .map((item, index) => ({ item, key: hashSeed(`${seed}:${index}`) }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

function pickRound(
  speaker: SpeakerWrapped,
  id: string,
  scope: MdbPickRound['scope'],
  question: string,
  word: MdbQuizWord,
  explanation: string,
  used: Set<string>,
): MdbPickRound | null {
  const wrong = distractors(speaker, new Set([...used, word.word]), 3);
  if (wrong.length < 3) return null;
  const options = shuffled([word.word, ...wrong], `${speaker.slug}:${id}`).map(text => ({ text, isCorrect: text === word.word }));
  return { kind: 'pick', id, scope, question, word, options, explanation };
}

/** Slider end: at least 20×, otherwise 1.5× the answer, rounded up to a multiple of 5. */
export function estimateMax(answer: number): number {
  return Math.max(20, Math.ceil((answer * 1.5) / 5) * 5);
}

/** Within a quarter of the answer (at least 1×) counts as right. */
export function estimateIsCorrect(guess: number, answer: number): boolean {
  return Math.abs(guess - answer) <= Math.max(1, answer * 0.25);
}

export function estimateVerdict(guess: number, answer: number): 'Richtig!' | 'Fast!' | 'Daneben.' {
  if (estimateIsCorrect(guess, answer)) return 'Richtig!';
  return Math.abs(guess - answer) <= Math.max(2, answer * 0.5) ? 'Fast!' : 'Daneben.';
}

/** How much more often the faction says a word than the Bundestag average. */
export function factionFactor(word: MdbQuizWord): number | null {
  return word.bundestag && word.party ? word.bundestag / word.party : null;
}

export function buildMdbQuiz(speaker: SpeakerWrapped): MdbQuiz | null {
  const name = firstName(speaker);
  const words = quizWords(speaker);
  const rounds: MdbQuizRound[] = [];
  const used = new Set<string>();

  const top = words.find(word => word.bundestag !== null);
  if (top?.bundestag) {
    const round = pickRound(
      speaker, 'bundestag-pick', 'bundestag',
      `Welches Wort sagt ${name} viel öfter als der Bundestag?`,
      top,
      `${formatRatio(top.bundestag)} häufiger als der Bundestag-Durchschnitt. Kein anderes Wort hebt ${name} so deutlich ab.`,
      used,
    );
    if (round) { rounds.push(round); used.add(top.word); }
    rounds.push({
      kind: 'estimate', id: 'bundestag-estimate', scope: 'bundestag',
      question: `Wie viel häufiger sagt ${name} „${top.word}“ als der Bundestag?`,
      word: top, answer: top.bundestag, max: estimateMax(top.bundestag),
    });
  }

  const partyWord = [...words].filter(word => word.party !== null && !used.has(word.word)).sort((a, b) => (b.party ?? 0) - (a.party ?? 0))[0];
  if (partyWord?.party) {
    const round = pickRound(
      speaker, 'party-pick', 'party',
      `Welches Wort sagt ${name} viel öfter als die eigene Fraktion?`,
      partyWord,
      `${formatRatio(partyWord.party)} häufiger als die Fraktion ${speaker.party}.`,
      used,
    );
    if (round) { rounds.push(round); used.add(partyWord.word); }
  }

  const compared = words.find(word => {
    const factor = factionFactor(word);
    return factor !== null && Math.abs(factor - 1) >= MIN_FACTION_GAP;
  });
  const factor = compared ? factionFactor(compared) : null;
  if (compared && factor) {
    const more = factor > 1;
    rounds.push({
      kind: 'pick', id: 'faction-direction', scope: 'party',
      question: `Und die Fraktion ${speaker.party}: sagt sie „${compared.word}“ häufiger oder seltener als der Bundestag?`,
      word: compared,
      options: [{ text: 'Häufiger', isCorrect: more }, { text: 'Seltener', isCorrect: !more }],
      explanation: `${more ? 'Häufiger' : 'Seltener'}: Die Fraktion sagt es ${formatRatio(factor)} so oft wie der Bundestag, ${name} ${formatRatio(compared.bundestag!)}.`,
    });
  }

  if (rounds.length < MIN_QUIZ_ROUNDS) return null;
  return { firstName: name, party: speaker.party, rounds, words: words.slice(0, 6) };
}

/** German genitive of a first name: "Lukas’", "Annas". */
export function genitive(name: string): string {
  return /[sxzß]$/i.test(name) ? `${name}’` : `${name}s`;
}

export function finalLine(score: number, total: number, name: string): string {
  const share = total ? score / total : 0;
  if (share === 1) return `Du könntest ${genitive(name)} Reden schreiben.`;
  if (share >= 0.75) return 'Fast schon Fraktionsreife.';
  if (share >= 0.5) return `Solide ${name}-Kenntnis.`;
  if (share > 0) return 'Da geht noch was.';
  return `Wer ist ${name}?`;
}
