import type { QuizConfig } from '../shared';

export interface MoinSpeaker {
  name: string;
  party: string;
  count: number;
}

function stableOrder(options: string[]): string[] {
  return [...options].sort((a, b) => a.localeCompare(b, 'de'));
}

export function buildMoinQuiz(speakers: readonly MoinSpeaker[]): QuizConfig | null {
  const options = [...new Set(speakers.slice(0, 4).map((speaker) => `${speaker.name} (${speaker.party})`))];
  const topSpeaker = speakers[0];
  if (!topSpeaker || options.length < 2) return null;
  return { question: 'Welche Person sagt am häufigsten „Moin“?', options: stableOrder(options), correctAnswer: `${topSpeaker.name} (${topSpeaker.party})`, explanation: `${topSpeaker.name} grüßt mit ${topSpeaker.count}× „Moin“!` };
}
