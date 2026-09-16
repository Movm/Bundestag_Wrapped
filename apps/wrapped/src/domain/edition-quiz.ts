import type { QuizQuestion, WrappedData } from '@/data/wrapped';
import type { EditionQuizConfiguration } from '@/generated/wrapped-contract-v1';
import { MissingMetricError, topInterrupter, topSpeakerByWords, topTopic } from './metrics';

export type EditionQuizModel = Record<string, QuizQuestion>;

const number = new Intl.NumberFormat('de-DE');

function question(id: QuizQuestion['id'], text: string, options: string[], answer: string, explanation: string, party?: string): QuizQuestion | undefined {
  const unique = [...new Set(options)].slice(0, 4);
  if (unique.length < 4 || !unique.includes(answer)) return undefined;
  return { id, type: party ? 'emoji-quiz' : 'prediction', question: text, options: unique, correctAnswer: answer, explanation, party };
}

function addQuestion(
  model: EditionQuizModel,
  id: string,
  build: () => QuizQuestion | undefined,
): void {
  try {
    const quiz = build();
    if (quiz) model[id] = quiz;
  } catch (error) {
    // Missing edition metrics are an expected absence. Contract and programming
    // errors must remain visible instead of silently removing later stories.
    if (!(error instanceof MissingMetricError)) throw error;
  }
}

/** Builds deterministic, evidence-backed quiz questions for one edition. */
export function buildEditionQuizModel(data: WrappedData): EditionQuizModel {
  const model: EditionQuizModel = {};
  addQuestion(model, 'quiz-topics', () => {
    const winner = topTopic(data);
    const topics = (data.topicAnalysis?.topTopics ?? []).map(item => item.topic);
    return question('quiz-topics', 'Welches Thema dominiert den Bundestag?', [winner, ...topics, ...data.hotTopics], winner, `${winner} ist das Topthema dieser Edition.`);
  });

  addQuestion(model, 'quiz-signature', () => {
    const signatureParty = [...data.parties]
      .filter(party => party.signatureWords.length >= 4)
      .sort((a, b) => (b.signatureWords[0]?.ratio ?? 0) - (a.signatureWords[0]?.ratio ?? 0))[0];
    if (signatureParty?.signatureWords[0]) {
      const winnerWord = signatureParty.signatureWords[0];
      return question('quiz-signature', `Welches Wort nutzt ${signatureParty.party} am meisten im Vergleich zu anderen?`, signatureParty.signatureWords.map(word => word.word), winnerWord.word, `„${winnerWord.word}“ ist bei ${signatureParty.party} ${winnerWord.ratio.toLocaleString('de-DE', { maximumFractionDigits: 1 })}× häufiger vertreten.`);
    }
    return undefined;
  });

  addQuestion(model, 'quiz-speeches', () => {
    const speaker = topSpeakerByWords(data);
    const speakers = data.topSpeakersByWords ?? [];
    const speakerName = `${speaker.name} (${speaker.party})`;
    return question('quiz-speeches', 'Wer hat im Bundestag insgesamt am längsten geredet?', [speakerName, ...speakers.map(item => `${item.name} (${item.party})`)], speakerName, `${speaker.name} (${speaker.party}) mit ${number.format(speaker.totalWords)} Wörtern.`);
  });

  addQuestion(model, 'quiz-drama', () => {
    const interrupter = topInterrupter(data);
    const interrupterName = `${interrupter.name} (${interrupter.party})`;
    return question('quiz-drama', 'Wer hat am meisten dazwischengerufen?', [interrupterName, ...data.drama.topZwischenrufer.map(item => `${item.name} (${item.party})`)], interrupterName, `${interrupter.name} (${interrupter.party}) mit ${number.format(interrupter.count)} Zwischenrufen.`);
  });

  addQuestion(model, 'quiz-common-words', () => {
    const word = data.hotTopics[0];
    return word
      ? question('quiz-common-words', 'Was war das meistgenutzte Wort?', data.hotTopics, word, `„${word}“ ist in dieser Edition das häufigste Wort.`)
      : undefined;
  });

  addQuestion(model, 'quiz-gender', () => {
    const gender = [...(data.genderAnalysis?.byParty ?? [])].filter(item => item.party !== 'fraktionslos').sort((a, b) => b.femaleRatio - a.femaleRatio);
    return gender[0]
      ? question('quiz-gender', 'Welche Fraktion hat den höchsten Frauenanteil bei Reden?', gender.map(item => item.party), gender[0].party, `${gender[0].party} mit ${gender[0].femaleRatio.toLocaleString('de-DE', { maximumFractionDigits: 0 })} %.`)
      : undefined;
  });

  addQuestion(model, 'quiz-discriminatory', () => {
    const discriminatory = data.toneAnalysis?.rankings.discriminatoryCounts ?? data.toneAnalysis?.rankings.discriminatory;
    if (discriminatory?.[0]) {
      const winner = discriminatory[0];
      return question('quiz-discriminatory', 'Welche Partei nutzt am häufigsten diskriminierende und abwertende Sprache?', discriminatory.map(item => item.party), winner.party, `${winner.party} liegt in dieser Kennzahl vorn.`);
    }
    return undefined;
  });

  addQuestion(model, 'quiz-tone', () => {
    const tone = data.toneAnalysis?.partyProfiles ? Object.values(data.toneAnalysis.partyProfiles).sort((a, b) => a.rank - b.rank) : [];
    return tone[0]
      ? question('quiz-tone', `Welches Emoji passt zu ${tone[0].party}?`, tone.slice(0, 4).map(item => item.emoji), tone[0].emoji, `${tone[0].party}: ${tone[0].description}`, tone[0].party)
      : undefined;
  });
  return model;
}

/**
 * Applies an edition's ordered quiz configuration to the data-derived model.
 * A missing configuration intentionally returns the legacy model verbatim: it
 * is the compatibility boundary for the frozen 2025 edition.
 */
export function applyEditionQuizConfiguration(
  generated: EditionQuizModel,
  configuration?: EditionQuizConfiguration,
): EditionQuizModel {
  if (!configuration) return generated;

  const configured: EditionQuizModel = {};
  const groupIds = new Set<string>();
  const questionIds = new Set<string>();
  for (const group of configuration.groups) {
    if (groupIds.has(group.id)) throw new Error(`Quiz configuration contains duplicate group ID: ${group.id}`);
    groupIds.add(group.id);
    const baseQuiz = group.question ?? generated[group.id];
    const quiz = baseQuiz && group.text ? { ...baseQuiz, ...group.text } : baseQuiz;
    if (!quiz) throw new Error(`Quiz configuration references unavailable group: ${group.id}`);
    if (quiz.id !== group.id) throw new Error(`Quiz question ID must match its group ID: ${group.id}`);
    if (questionIds.has(quiz.id)) throw new Error(`Quiz configuration contains duplicate question ID: ${quiz.id}`);
    questionIds.add(quiz.id);
    if (!quiz.options.includes(quiz.correctAnswer)) throw new Error(`Quiz question has no matching correct answer: ${quiz.id}`);
    if (new Set(quiz.options).size !== quiz.options.length) throw new Error(`Quiz question has duplicate options: ${quiz.id}`);
    configured[group.id] = quiz;
  }
  return configured;
}

export function buildConfiguredEditionQuizModel(
  data: WrappedData,
  configuration?: EditionQuizConfiguration,
): EditionQuizModel {
  return applyEditionQuizConfiguration(buildEditionQuizModel(data), configuration);
}
