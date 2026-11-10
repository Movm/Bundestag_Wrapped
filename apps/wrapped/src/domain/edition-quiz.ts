import type { QuizQuestion, WrappedData } from '@/data/wrapped';
import { youthWordMeaning } from './youth-words';
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

interface RankMovement { label: string; currentRank: number; rankChange: number }

/**
 * Picks the riser and the distractors for a "who rose the most" question.
 * Several entries can share the biggest rank change. The winner is then the one
 * with the better (lower) current rank, a deterministic tie-break. Every other
 * entry with the same rank change is dropped from the options, so the question
 * never offers a second answer that is equally correct.
 */
export function pickRiserOptions<T extends RankMovement>(items: T[]): { winner: T; options: string[] } | undefined {
  const winner = items.reduce<T | undefined>((best, item) => (
    !best || item.rankChange > best.rankChange || (item.rankChange === best.rankChange && item.currentRank < best.currentRank) ? item : best
  ), undefined);
  if (!winner) return undefined;
  const distractors = items.filter(item => item.rankChange !== winner.rankChange).map(item => item.label);
  return { winner, options: [winner.label, ...distractors] };
}

/** Numeric options around the real count: it, two higher ones and a lower one (0 at the bottom). */
function countOptions(count: number): string[] {
  return [...new Set([count, count + 2, count + 4, count > 2 ? count - 2 : 0])].map(value => number.format(value));
}

function jugendwortQuestion(word: { word: string; count: number; winnerYear?: number }): QuizQuestion | undefined {
  if (word.count < 1) return undefined;
  return question(
    'quiz-youth-language',
    `Wie oft fiel das Jugendwort ${word.winnerYear} „${word.word}“ bisher im Bundestag?`,
    countOptions(word.count),
    number.format(word.count),
    `„${word.word}“ kommt auf ${number.format(word.count)} kontextuell bestätigte Treffer. ${youthWordMeaning(word.word) ?? ''}`.trim(),
  );
}

interface WordSpeaker { name: string; party: string; count: number }
type YouthWord = { word: string; count: number; winnerYear?: number; speakers?: WordSpeaker[] };

const speakerLabel = (speaker: { name: string; party: string }) => `${speaker.name} (${speaker.party})`;

/**
 * Asks who said the flagged Jugendwort. The pipeline orders `speakers` by count
 * (descending) and then name, so the first entry is the correct answer; on a tie
 * the alphabetically first name wins (speeches carry no date here). Every other
 * speaker of the word is kept out of the options so no second answer is correct.
 * Distractors are people who used other youth words but not this one, preferring
 * parties not yet in the options, then other prominent speakers of the edition.
 * With fewer than four options the question is omitted.
 */
function jugendwortSpeakerQuestion(
  word: YouthWord & { speakers: WordSpeaker[] },
  youthSpeakers: Array<{ name: string; party: string }>,
  prominentSpeakers: Array<{ name: string; party: string }>,
): QuizQuestion | undefined {
  const [winner, ...others] = word.speakers;
  if (!winner) return undefined;
  const sayers = new Set(word.speakers.map(speaker => speaker.name));
  const pool = [...youthSpeakers, ...prominentSpeakers].filter(speaker => !sayers.has(speaker.name));
  const unique = pool.filter((speaker, index) => pool.findIndex(other => other.name === speaker.name) === index);
  const usedParties = new Set([winner.party]);
  const picked: Array<{ name: string; party: string }> = [];
  for (const speaker of unique) {
    if (picked.length === 3) break;
    if (usedParties.has(speaker.party)) continue;
    usedParties.add(speaker.party);
    picked.push(speaker);
  }
  for (const speaker of unique) {
    if (picked.length === 3) break;
    if (!picked.includes(speaker)) picked.push(speaker);
  }
  const answer = speakerLabel(winner);
  const times = (count: number) => (count === 1 ? 'einmal' : `${number.format(count)}-mal`);
  const alsoSaid = others.length
    ? ` Auch gesagt haben es ${others.map(speaker => `${speakerLabel(speaker)} (${times(speaker.count)})`).join(', ')}.`
    : '';
  const meaning = youthWordMeaning(word.word) ? ` ${youthWordMeaning(word.word)}` : '';
  return question(
    'quiz-youth-language',
    `Das Jugendwort ${word.winnerYear} heißt „${word.word}“. Wer hat es im Bundestag gesagt?`,
    [answer, ...picked.map(speakerLabel)],
    answer,
    `${answer} sagte „${word.word}“ ${times(winner.count)}.${alsoSaid}${meaning} Das sagt nur, dass das Wort fiel, nicht, wie es gemeint war.`,
  );
}

/**
 * Asks which parliamentary group has the most Gen Z MPs at the lectern. Only
 * asked when one group clearly leads, so no second option is also correct.
 */
function genzPartyQuestion(generations: { speakerCount: number; parties: Array<{ party: string; count: number }> }): QuizQuestion | undefined {
  const [winner, ...others] = generations.parties;
  if (!winner || others.some(item => item.count >= winner.count)) return undefined;
  return question(
    'quiz-genz',
    'Welche Fraktion hat die meisten Gen-Z-Abgeordneten, die gesprochen haben?',
    [winner.party, ...others.map(item => item.party)],
    winner.party,
    `${winner.party}: ${number.format(winner.count)} der ${number.format(generations.speakerCount)} Gen-Z-Abgeordneten, die im Plenum sprachen.`,
  );
}

/**
 * Asks who talked most about the edition's moment of the year (e.g. "Timmy der
 * Wal"). Only asked when one MP clearly leads; the wrong options are other MPs
 * who mentioned it less often, so no second answer is correct.
 */
function mentionQuestion(mention: { label: string; speakers: Array<{ name: string; party: string; count: number }> }): QuizQuestion | undefined {
  const [winner, ...others] = mention.speakers;
  if (!winner || others.some(speaker => speaker.count >= winner.count)) return undefined;
  const answer = speakerLabel(winner);
  const times = winner.count === 1 ? 'einmal' : `${number.format(winner.count)}-mal`;
  return question(
    'quiz-mention',
    `Wer hat ${mention.label} im Plenum am häufigsten erwähnt?`,
    [answer, ...others.slice(0, 3).map(speakerLabel)],
    answer,
    `${answer} erwähnte ${mention.label} ${times}, alle anderen höchstens ${others[0]?.count === 1 ? 'einmal' : `${number.format(others[0]?.count ?? 0)}-mal`}. Gezählt wird, wie oft der Name fiel, nicht in welchem Zusammenhang.`,
  );
}

/** Builds deterministic, evidence-backed quiz questions for one edition. */
export function buildEditionQuizModel(data: WrappedData, configuration?: EditionQuizConfiguration): EditionQuizModel {
  const model: EditionQuizModel = {};
  addQuestion(model, 'quiz-topic-riser', () => {
    const comparison = data.yearOverYear;
    const picked = comparison ? pickRiserOptions(comparison.topics) : undefined;
    if (!comparison || !picked) return undefined;
    const { winner } = picked;
    const baseline = comparison.baseline.editionId;
    const movement = winner.previousRank === null
      ? `neu auf Platz ${winner.currentRank}`
      : `von Platz ${winner.previousRank} auf Platz ${winner.currentRank}`;
    return question(
      'quiz-topic-riser',
      `Über welches Thema wird gegenüber ${baseline} deutlich mehr geredet?`,
      picked.options,
      winner.label,
      `${winner.label} stieg ${movement}. Gemessen daran, wie viele Wörter in den Reden zum Thema gehören, nicht an der Zahl der Reden.`,
    );
  });

  addQuestion(model, 'quiz-word-riser', () => {
    const comparison = data.yearOverYear;
    // A new top-list entry is useful data, but it has no actual prior rank and
    // therefore must not win a question specifically about moving up.
    const movements = comparison?.words.filter(item => item.previousRank !== null) ?? [];
    const picked = pickRiserOptions(movements);
    if (!comparison || !picked) return undefined;
    const { winner } = picked;
    const movement = winner.previousRank === null
      ? `neu auf Platz ${winner.currentRank}`
      : `von Platz ${winner.previousRank} auf Platz ${winner.currentRank}`;
    return question(
      'quiz-word-riser',
      'Was ist das Aufsteigerwort des Jahres?',
      picked.options,
      winner.label,
      `„${winner.label}“ stieg ${movement}.`,
    );
  });

  addQuestion(model, 'quiz-youth-language', () => {
    const comparison = data.yearOverYear;
    // The lexicon marks the current Jugendwort with a winner year (youth-words.json).
    // When one exists the question is about it; without a hit it is omitted.
    const jugendwort = [...(comparison?.youthLanguage.words ?? [])]
      .filter(item => item.winnerYear !== undefined)
      .sort((a, b) => (b.winnerYear ?? 0) - (a.winnerYear ?? 0))[0];
    if (jugendwort?.speakers?.length) {
      return jugendwortSpeakerQuestion(
        { ...jugendwort, speakers: jugendwort.speakers },
        comparison?.youthLanguage.bySpeaker ?? [],
        data.topSpeakersByWords ?? [],
      );
    }
    // Editions generated before per-word speakers existed keep the count question.
    if (jugendwort) return jugendwortQuestion(jugendwort);
    const words = (comparison?.youthLanguage.words ?? []).filter(item => item.count > 0);
    const winner = words[0];
    if (!winner) return undefined;
    const topParty = comparison?.youthLanguage.byParty.find(item => item.party !== 'fraktionslos');
    const partyDetail = topParty ? ` Die meisten Treffer entfielen auf ${topParty.party} (${number.format(topParty.count)}).` : '';
    return question(
      'quiz-youth-language',
      'Welches Wort aus unserer Jugendwortliste kam im Bundestag am häufigsten vor?',
      words.map(item => item.word),
      winner.word,
      `„${winner.word}“ kommt auf ${number.format(winner.count)} kontextuell bestätigte Treffer.${partyDetail}`,
    );
  });

  addQuestion(model, 'quiz-mention', () => {
    const mention = data.mentions?.[0];
    return mention ? mentionQuestion(mention) : undefined;
  });

  addQuestion(model, 'quiz-genz', () => {
    const generations = data.generations;
    return generations ? genzPartyQuestion(generations) : undefined;
  });

  addQuestion(model, 'quiz-topics', () => {
    const winner = topTopic(data);
    const topics = (data.topicAnalysis?.topTopics ?? []).map(item => item.topic);
    return question('quiz-topics', 'Welches Thema dominiert den Bundestag?', [winner, ...topics, ...data.hotTopics], winner, `${winner} ist das Topthema dieser Edition.`);
  });

  addQuestion(model, 'quiz-signature', () => {
    // An edition can pin the party; otherwise the strongest signature word wins.
    const pinned = configuration?.groups.find(group => group.id === 'quiz-signature')?.party;
    const signatureParty = [...data.parties]
      .filter(party => party.signatureWords.length >= 4 && (!pinned || party.party === pinned))
      .sort((a, b) => (b.signatureWords[0]?.ratio ?? 0) - (a.signatureWords[0]?.ratio ?? 0))[0];
    if (signatureParty?.signatureWords[0]) {
      const winnerWord = signatureParty.signatureWords[0];
      const ratio = winnerWord.ratio.toLocaleString('de-DE', { maximumFractionDigits: 1 });
      // The frozen 2025 edition (no configuration) keeps its published wording.
      return configuration
        ? question('quiz-signature', `Welches Wort fällt bei ${signatureParty.party} im Vergleich zu den anderen Fraktionen besonders auf?`, signatureParty.signatureWords.map(word => word.word), winnerWord.word, `„${winnerWord.word}“ sagt ${signatureParty.party} ${ratio}× so oft wie die anderen Fraktionen im Schnitt, gemessen pro 1.000 Wörter.`)
        : question('quiz-signature', `Welches Wort nutzt ${signatureParty.party} am meisten im Vergleich zu anderen?`, signatureParty.signatureWords.map(word => word.word), winnerWord.word, `„${winnerWord.word}“ ist bei ${signatureParty.party} ${ratio}× häufiger vertreten.`);
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
  return applyEditionQuizConfiguration(buildEditionQuizModel(data, configuration), configuration);
}
