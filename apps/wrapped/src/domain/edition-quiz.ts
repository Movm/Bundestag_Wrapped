import type { QuizQuestion, WrappedData } from '@/data/wrapped';
import { TOPIC_BY_ID } from '@/shared/constants/topics';
import { youthGeneration, youthWordMeaning, type YouthGeneration } from './youth-words';
import { lastName, shareOptions, split } from './chancellor';
import type { EditionQuizConfiguration } from '@/generated/wrapped-contract-v1';
import { MissingMetricError, topInterrupter, topSpeakerByWords, topTopic } from './metrics';
import { atParty, capitalize, theParty, times as spelledTimes } from '@/lib/german-count';

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

/** Who said it: the word is the question, not a claim that it won a Jugendwort title. */
const youthQuestion = (word: string) => `„${capitalize(word)}“ im Bundestag. Wer hat’s gesagt?`;

/** "Dr. Zoe Mayer" → "Zoe Mayer": titles end in a dot. */
const plainName = (name: string) => name.split(/\s+/).filter(part => part && !part.endsWith('.')).join(' ');

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
  const alsoSaid = others.length
    ? ` Auch gesagt haben es ${others.map(speaker => `${speaker.name} (${speaker.party}, ${spelledTimes(speaker.count)})`).join(', ')}.`
    : '';
  const meaning = youthWordMeaning(word.word) ? ` ${youthWordMeaning(word.word)}` : '';
  return question(
    'quiz-youth-language',
    youthQuestion(word.word),
    [answer, ...picked.map(speakerLabel)],
    answer,
    `${answer} sagte „${word.word}“ ${spelledTimes(winner.count)}.${alsoSaid}${meaning} Das sagt nur, dass das Wort fiel, nicht, wie es gemeint war.`,
  );
}

/** "Awet Tesfaiesus & Marcel Emmerich (GRÜNE)", or each with its party when they differ. */
function pairLabel([first, second]: readonly [{ name: string; party: string }, { name: string; party: string }]): string {
  return first.party === second.party
    ? `${first.name} & ${second.name} (${first.party})`
    : `${speakerLabel(first)} & ${speakerLabel(second)}`;
}

/**
 * A young pair the editors put among the wrong answers. It replaces the
 * data-picked pair of its parliamentary group, unless one of them said the word.
 */
const YOUNG_PAIR = [{ name: 'Philipp Amthor', party: 'CDU/CSU' }, { name: 'Anna Aeikens', party: 'CDU/CSU' }] as const;

/**
 * Asks which pair of MPs said the Jugendwort, when exactly two did. The wrong
 * pairs are two speakers of the same parliamentary group each (prominent
 * speakers first, then Gen Z MPs; other groups than the answer's first, no
 * AfD), so the pairing itself gives nothing away; nobody who said the word
 * appears in a wrong pair.
 */
function jugendwortPairQuestion(
  word: YouthWord & { speakers: WordSpeaker[] },
  pool: ReadonlyArray<{ name: string; party: string }>,
  genzSpeakers: ReadonlyArray<{ name: string }>,
): QuizQuestion | undefined {
  if (word.speakers.length !== 2) return undefined;
  const sayers = [word.speakers[0], word.speakers[1]] as const;
  const said = new Set(sayers.map(speaker => plainName(speaker.name)));
  const byParty = new Map<string, Array<{ name: string; party: string }>>();
  for (const speaker of pool) {
    // AfD MPs are treated separately in Wrapped, so they are not offered as a playful wrong answer here.
    if (said.has(plainName(speaker.name)) || speaker.party === 'fraktionslos' || speaker.party === 'AfD') continue;
    const members = byParty.get(speaker.party) ?? [];
    if (!members.some(member => member.name === speaker.name)) byParty.set(speaker.party, [...members, speaker]);
  }
  const groups = [...byParty.entries()]
    .filter(([, members]) => members.length >= 2)
    .sort(([a], [b]) => Number(a === sayers[0].party) - Number(b === sayers[0].party));
  const young = YOUNG_PAIR.some(speaker => said.has(plainName(speaker.name))) ? null : YOUNG_PAIR;
  const picked = groups.filter(([party]) => !young || party !== young[0].party).slice(0, young ? 2 : 3);
  const pairs = [
    ...picked.map(([, members]) => pairLabel([members[0], members[1]])),
    ...(young ? [pairLabel(young)] : []),
  ];
  const answer = pairLabel(sayers);
  const generation = youthGeneration(word.speakers, genzSpeakers);
  const verdict = generation === 'older' ? ' Keiner von beiden gehört zur Gen Z.' : generation === 'genz' ? ' Beide gehören zur Gen Z.' : '';
  const counts = sayers[0].count === 1 && sayers[1].count === 1 ? ', je einmal' : '';
  return question(
    'quiz-youth-language',
    youthQuestion(word.word),
    [answer, ...pairs],
    answer,
    `Gesagt haben es ${speakerLabel(sayers[0])} und ${speakerLabel(sayers[1])}${counts}.${verdict}${youthWordMeaning(word.word) ? ` ${youthWordMeaning(word.word)}` : ''}`,
  );
}

const GENERATION_OPTIONS: Record<YouthGeneration | 'none', string> = {
  genz: 'Die Gen Z',
  older: 'Die Älteren',
  both: 'Beide',
  none: 'Niemand',
};

/**
 * Opens the youth story: did the Jugendwort come from the young MPs? Fixed
 * option order (young, older, both, nobody), so the answer is not always first.
 */
function jugendwortGenerationQuestion(
  word: YouthWord & { speakers: WordSpeaker[] },
  genzSpeakers: ReadonlyArray<{ name: string }>,
): QuizQuestion | undefined {
  const generation = youthGeneration(word.speakers, genzSpeakers);
  if (!generation) return undefined;
  const names = new Intl.ListFormat('de', { type: 'conjunction' }).format(word.speakers.map(speakerLabel));
  const verdict = {
    genz: 'Alle gehören zur Gen Z.',
    older: word.speakers.length === 1 ? 'Nicht aus der Gen Z.' : 'Niemand davon gehört zur Gen Z.',
    both: 'Jung und Alt.',
  }[generation];
  return question(
    'quiz-youth-language',
    youthQuestion(word.word),
    [GENERATION_OPTIONS.genz, GENERATION_OPTIONS.older, GENERATION_OPTIONS.both, GENERATION_OPTIONS.none],
    GENERATION_OPTIONS[generation],
    `Gesagt haben es ${names}. ${verdict}${youthWordMeaning(word.word) ? ` ${youthWordMeaning(word.word)}` : ''}`,
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
    'Welche Fraktion bringt die meisten Stimmen der Gen Z ans Rednerpult?',
    [winner.party, ...others.map(item => item.party)],
    winner.party,
    `${winner.party}: ${number.format(winner.count)} der ${number.format(generations.speakerCount)} erfassten Gen-Z-Abgeordneten gehören zu ihrer Fraktion.${winner.count * 2 > generations.speakerCount ? ' Damit stellt sie mehr als die Hälfte.' : ''}`,
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
  const runnerUp = others[0]?.count ?? 0;
  const rest = runnerUp === 1 ? 'Bei allen anderen, die den Namen nannten, blieb es bei einem Mal.' : `Alle anderen kamen auf höchstens ${spelledTimes(runnerUp)}.`;
  return question(
    'quiz-mention',
    `Wer hat ${mention.label} im Plenum am häufigsten erwähnt?`,
    [answer, ...others.slice(0, 3).map(speakerLabel)],
    answer,
    `${plainName(winner.name)} erwähnte ${mention.label} ${spelledTimes(winner.count)}. ${rest}`,
  );
}

/**
 * Innen- oder Außenkanzler: how much of what the chancellor talks about is
 * foreign policy. Options are the real share and three others 14 points apart.
 */
function chancellorQuestion(chancellor: { name: string; foreignShare: number; chamberForeignShare: number }): QuizQuestion | undefined {
  const { foreign, domestic } = split(chancellor.foreignShare);
  const chamber = split(chancellor.chamberForeignShare).foreign;
  return question(
    'quiz-chancellor',
    `Wie viel von dem, worüber ${lastName(chancellor.name)} im Plenum spricht, ist Außenpolitik?`,
    shareOptions(chancellor.foreignShare),
    `${foreign} %`,
    `${foreign} % seiner Themenwörter gehören zur Außenpolitik, ${domestic} % zur Innenpolitik. Im restlichen Bundestag liegt der Außen-Anteil bei ${chamber} %.`,
  );
}

/**
 * The group the signature-word quiz is about: pinned by the edition, otherwise
 * the one whose strongest word stands out most. The chapter intro uses it too.
 */
export function signatureQuizParty(data: WrappedData, configuration?: EditionQuizConfiguration) {
  const pinned = configuration?.groups.find(group => group.id === 'quiz-signature')?.party;
  return [...data.parties]
    .filter(party => party.signatureWords.length >= 4 && (!pinned || party.party === pinned))
    .sort((a, b) => (b.signatureWords[0]?.ratio ?? 0) - (a.signatureWords[0]?.ratio ?? 0))[0];
}

/** "rund doppelt so häufig", "rund dreimal …", otherwise "2,6-mal so häufig". */
function ratioPhrase(ratio: number): string {
  if (Math.abs(ratio - 2) <= 0.15) return 'rund doppelt so häufig';
  if (Math.abs(ratio - 3) <= 0.15) return 'rund dreimal so häufig';
  return `${ratio.toLocaleString('de-DE', { maximumFractionDigits: 1 })}-mal so häufig`;
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
    const name = (id: string) => TOPIC_BY_ID[id]?.name ?? id;
    // "Platz 1" is only promised when the winner really leads and had a prior rank.
    const leads = winner.currentRank === 1 && winner.previousRank !== null;
    return question(
      'quiz-topic-riser',
      leads
        ? 'Über welches Thema wurde dieses Jahr im Bundestag am meisten gesprochen?'
        : `Welches Thema ist gegenüber ${baseline} am weitesten nach oben geklettert?`,
      picked.options.map(name),
      name(winner.label),
      leads
        ? `${name(winner.label)}! Im gleichen Zeitraum ${baseline} noch auf Platz ${winner.previousRank}, liegt das Thema dieses Mal vorn.`
        : `${name(winner.label)} stieg ${movement}. Gemessen daran, wie viele Wörter in den Reden zum Thema gehören, nicht an der Zahl der Reden.`,
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
    if (jugendwort?.speakers?.length === 2) {
      const pair = jugendwortPairQuestion(
        { ...jugendwort, speakers: jugendwort.speakers },
        [...(comparison?.youthLanguage.bySpeaker ?? []), ...(data.topSpeakersByWords ?? []), ...(data.generations?.speakers ?? [])],
        data.generations?.speakers ?? [],
      );
      if (pair) return pair;
    }
    if (jugendwort?.speakers?.length && data.generations?.speakers.length) {
      return jugendwortGenerationQuestion({ ...jugendwort, speakers: jugendwort.speakers }, data.generations.speakers);
    }
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

  addQuestion(model, 'quiz-chancellor', () => (data.chancellor ? chancellorQuestion(data.chancellor) : undefined));

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
    const signatureParty = signatureQuizParty(data, configuration);
    if (signatureParty?.signatureWords[0]) {
      const winnerWord = signatureParty.signatureWords[0];
      const ratio = winnerWord.ratio.toLocaleString('de-DE', { maximumFractionDigits: 1 });
      // The frozen 2025 edition (no configuration) keeps its published wording.
      return configuration
        ? question(
          'quiz-signature',
          `Welches Wort steht ${atParty(signatureParty.party)} auf Platz 1 unserer Liste typischer Wörter?`,
          signatureParty.signatureWords.map(word => capitalize(word.word)),
          capitalize(winnerWord.word),
          `„${capitalize(winnerWord.word)}“ liegt vorn. ${theParty(signatureParty.party)} verwendet das Wort ${ratioPhrase(winnerWord.ratio)} wie die übrigen Fraktionen im Schnitt – gemessen pro 1.000 Wörter. Für unsere Rangliste zählt beides: wie häufig ein Wort fällt und wie stark es sich von den anderen Fraktionen abhebt.`,
        )
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
