/**
 * Types and loaders for individual speaker Bundestag Wrapped data.
 */

export interface SpeakerSummary {
  slug: string;
  name: string;
  party: string;
  speeches: number;
  wortbeitraege: number;
  words: number;
}

export interface SpeakerIndex {
  speakers: SpeakerSummary[];
}

export interface SpeakerRankings {
  speechRank: number;
  wordsRank: number;
  partySpeechRank: number;
  partyWordsRank: number;
  partySize: number;
  totalSpeakers: number;
  percentile: number;
  // Verbosity rankings (avg words per speech, min 3 speeches required)
  verbosityRank: number | null;
  verbosityTotal: number | null;
  partyVerbosityRank: number | null;
  // Longest speech ranking
  longestSpeechRank: number;
}

export interface SpeakerDrama {
  interruptionsGiven: number;
  interruptionsReceived: number;
  interrupterRank: number | null;
  interruptedRank: number | null;
}

export interface SpeakerWord {
  word: string;
  count: number;
}

/**
 * Signature word with score-based ranking.
 * score = count × log(ratio + 1) balances frequency with uniqueness.
 */
export interface SignatureWord {
  word: string;
  count: number;
  score?: number; // Balanced ranking: count × log(ratio + 1)
  ratio?: number; // Usage ratio vs comparison group (Bundestag or Party)
  // Legacy exporter fields kept while generated JSON catches up.
  ratioParty?: number;
  ratioBundestag?: number;
}

export interface SpeakerWords {
  topWords: SpeakerWord[];
  // Legacy fields emitted by older exports.
  signatureWords?: SignatureWord[];
  signatureAdjectives?: SignatureWord[];
  // Signature words compared to Bundestag average (national uniqueness)
  signatureWordsBundestag?: SignatureWord[];
  // Signature words compared to party average (faction uniqueness)
  signatureWordsParty?: SignatureWord[];
  // Signature adjectives compared to Bundestag average
  signatureAdjectivesBundestag?: SignatureWord[];
  // Signature adjectives compared to party average
  signatureAdjectivesParty?: SignatureWord[];
}

export interface SpeakerComparison {
  speakerAvgWords: number;
  partyAvgWords: number;
  parliamentAvgWords: number;
  vsParty: number;
  vsParliament: number;
}

export interface SpeakerFunFact {
  emoji: string;
  label: string;
  value: string;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface SignatureQuiz {
  question: string;
  options: QuizOption[];
  explanationParty: string; // "X× häufiger als SPD-Durchschnitt"
  explanationBundestag: string; // "Y× häufiger als Bundestag-Durchschnitt"
}

export interface AdjectiveQuiz {
  question: string;
  options: QuizOption[];
  explanationParty: string; // "X× häufiger als SPD-Durchschnitt"
  explanationBundestag: string; // "Y× häufiger als Bundestag-Durchschnitt"
}

export interface SpiritAnimalAlternative {
  id: string;
  emoji: string;
  name: string;
  title: string;
  reason: string;
  score: number;
}

export interface SpiritAnimal {
  id: string;
  emoji: string;
  name: string;
  title: string;
  reason: string;
  alternatives?: SpiritAnimalAlternative[];
}

export interface ToneScores {
  affirmative: number;
  aggression: number;
  labeling: number;
  solution_focus: number;
  collaboration: number;
  demand_intensity: number;
  acknowledgment: number;
  authority: number;
  future_orientation: number;
  emotional_intensity: number;
  inclusivity: number;
  discriminatory: number;
}

export interface ToneSampleSize {
  speeches: number;
  words: number;
  adjectives: number;
  verbs: number;
}

export interface ToneProfile {
  scores: ToneScores;
  confidence: 'sufficient' | 'low';
  sampleSize: ToneSampleSize;
}

export interface TopicWord {
  word: string;
  count: number;
}

export interface TopicScore {
  topic: string;
  score: number;
  rank: number;
}

export interface SpeakerTopics {
  scores: Record<string, number>;
  topTopics: TopicScore[];
  topicWords: Record<string, TopicWord[]>;
}

export interface OfficialImageMetadata {
  url: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  sourceLabel: string;
  imageNumber?: string;
  photographer?: string;
  credit: string;
  caption?: string;
  alt?: string;
  takenAt?: string;
  usageNotice?: string;
  socialMediaAllowed?: boolean;
}

export interface ProfileImageMetadata extends OfficialImageMetadata {
  license?: string;
  licenseUrl?: string;
}

export interface ProfileDescription {
  text: string;
  longText?: string;
  shortDescription?: string;
  sourceUrl: string;
  sourceLabel: string;
  license?: string;
  revision?: string;
  updatedAt?: string;
}

export interface SpeakerBiography {
  birthDate?: string;
  birthPlace?: string;
  residence?: string;
  profession?: string;
  constituency?: string;
  roles?: string[];
  education?: string[];
  memberships?: string[];
  sourceUrl?: string;
  sourceLabel?: string;
  updatedAt?: string;
}

export interface AbgeordnetenwatchPolitician {
  id: number;
  url: string;
  party?: string | null;
  yearOfBirth?: number | null;
  education?: string | null;
  residence?: string | null;
  occupation?: string | null;
  questions?: number | null;
  questionsAnswered?: number | null;
  bundestagAdministrationId?: string | null;
  wikidataId?: string | null;
}

export interface AbgeordnetenwatchMandate {
  id: number;
  label: string;
  parliamentPeriod?: string | null;
  fraction?: string | null;
  constituency?: string | null;
  list?: string | null;
  listPosition?: number | null;
  constituencyResult?: number | null;
  mandateWon?: string | null;
  apiUrl?: string | null;
}

export interface AbgeordnetenwatchSidejob {
  id: number;
  title: string;
  organization?: string | null;
  category?: string | null;
  categoryLabel?: string | null;
  income?: number | null;
  incomeLevel?: number | null;
  interval?: string | null;
  intervalLabel?: string | null;
  city?: string | null;
  country?: string | null;
  topics?: string[];
  dataChangeDate?: string | null;
  apiUrl?: string | null;
}

export interface AbgeordnetenwatchVote {
  id: number;
  pollId: number;
  pollLabel: string;
  vote: 'yes' | 'no' | 'abstain' | 'no_show' | string;
  reasonNoShow?: string | null;
  fraction?: string | null;
  url?: string | null;
}

export interface AbgeordnetenwatchProfile {
  sourceLabel: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  updatedAt: string;
  politician: AbgeordnetenwatchPolitician;
  mandate?: AbgeordnetenwatchMandate | null;
  sidejobs?: AbgeordnetenwatchSidejob[];
  votes?: {
    total?: number | null;
    recent: AbgeordnetenwatchVote[];
  };
  notes?: string[];
}

export interface SpeakerWrapped {
  name: string;
  party: string;
  slug: string;
  academicTitle: string | null;
  speeches: number;
  wortbeitraege: number;
  befragungResponses: number;
  totalWords: number;
  avgWords: number;
  minWords: number;
  maxWords: number;
  rankings: SpeakerRankings;
  drama: SpeakerDrama;
  words: SpeakerWords;
  comparison: SpeakerComparison;
  funFacts: SpeakerFunFact[];
  signatureQuiz: SignatureQuiz | null;
  signatureAdjectiveQuiz: AdjectiveQuiz | null;
  spiritAnimal: SpiritAnimal | null;
  toneProfile: ToneProfile | null;
  topics: SpeakerTopics | null;
  officialImage?: OfficialImageMetadata | null;
  profileImage?: ProfileImageMetadata | null;
  profileDescription?: ProfileDescription | null;
  biography?: SpeakerBiography | null;
  abgeordnetenwatch?: AbgeordnetenwatchProfile | null;
}

interface SpeakerEnrichment {
  officialImage?: OfficialImageMetadata | null;
  profileImage?: ProfileImageMetadata | null;
  profileDescription?: ProfileDescription | null;
  biography?: SpeakerBiography | null;
  abgeordnetenwatch?: AbgeordnetenwatchProfile | null;
}

/**
 * Load the speaker index (list of all speakers with basic stats).
 * Note: Caching is handled by React Query.
 */
export async function loadSpeakerIndex(): Promise<SpeakerIndex> {
  const response = await fetch('/speakers/index.json');
  if (!response.ok) {
    throw new Error(`Failed to load speaker index: ${response.status}`);
  }
  return response.json();
}

/**
 * Load detailed wrapped data for a specific speaker.
 */
export async function loadSpeakerData(slug: string): Promise<SpeakerWrapped> {
  const response = await fetch(`/speakers/${slug}.json`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Speaker not found: ${slug}`);
    }
    throw new Error(`Failed to load speaker data: ${response.status}`);
  }

  const speaker = await response.json() as SpeakerWrapped;

  try {
    const enrichmentResponse = await fetch(`/speaker-enrichment/${slug}.json`);
    if (!enrichmentResponse.ok) {
      return speaker;
    }

    const enrichment = await enrichmentResponse.json() as SpeakerEnrichment;
    return {
      ...speaker,
      officialImage: enrichment.officialImage ?? speaker.officialImage ?? null,
      profileImage: enrichment.profileImage ?? speaker.profileImage ?? enrichment.officialImage ?? speaker.officialImage ?? null,
      profileDescription: enrichment.profileDescription ?? speaker.profileDescription ?? null,
      biography: enrichment.biography ?? speaker.biography ?? null,
      abgeordnetenwatch: enrichment.abgeordnetenwatch ?? speaker.abgeordnetenwatch ?? null,
    };
  } catch {
    return speaker;
  }
}

/**
 * Search speakers by name.
 */
export function searchSpeakers(
  speakers: SpeakerSummary[],
  query: string
): SpeakerSummary[] {
  if (!query.trim()) return speakers;

  const lowerQuery = query.toLowerCase();
  return speakers.filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.party.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter speakers by party.
 */
export function filterByParty(
  speakers: SpeakerSummary[],
  party: string
): SpeakerSummary[] {
  if (!party) return speakers;
  return speakers.filter((s) => s.party === party);
}
