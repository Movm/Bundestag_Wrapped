import type {
  AbgeordnetenwatchProfile,
  ProfileDescription,
  SignatureWord,
  SpeakerWrapped,
  SpiritAnimal,
} from '@/data/speaker-wrapped';

type WikimediaIntro = {
  text: string;
  sourceUrl: string;
  revision?: string;
  updatedAt?: string;
};

type BuildMdbSummaryInput = {
  speaker: SpeakerWrapped;
  displayName: string;
  topTopicName?: string;
  signatureWord?: SignatureWord;
  spiritAnimal?: SpiritAnimal | null;
  abgeordnetenwatch?: AbgeordnetenwatchProfile | null;
  wikipediaIntro?: WikimediaIntro | null;
  fallbackDescription?: ProfileDescription | null;
};

type RankedFact = {
  score: number;
  text: string;
};

function normalizeSentence(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function firstSentence(text?: string | null): string {
  if (!text) return '';
  const compact = text.replace(/\s*\(\*[^)]*\)/, '').replace(/\s+/g, ' ').trim();
  for (let index = 0; index < compact.length; index += 1) {
    const char = compact[index];
    if (!char || !'.!?'.includes(char)) continue;

    const previous = compact[index - 1] ?? '';
    const next = compact[index + 1] ?? '';
    const abbreviation = compact.slice(Math.max(0, index - 5), index + 1);
    if (char === '.' && /\d/.test(previous)) continue;
    if (char === '.' && /\b(?:Dr|Prof|bzw|ca|u|a|z|B)\.$/.test(abbreviation)) continue;
    if (next && !/\s/.test(next)) continue;

    return normalizeSentence(compact.slice(0, index + 1));
  }
  return normalizeSentence(compact);
}

function joinFacts(facts: string[]): string {
  if (facts.length <= 1) return facts[0] ?? '';
  if (facts.length === 2) return `${facts[0]} und ${facts[1]}`;
  return `${facts.slice(0, -1).join(', ')} und ${facts[facts.length - 1]}`;
}

function strongestRankFacts(speaker: SpeakerWrapped): RankedFact[] {
  const facts: RankedFact[] = [];

  if (speaker.rankings.wordsRank <= 10) {
    facts.push({
      score: 110 - speaker.rankings.wordsRank,
      text: `#${speaker.rankings.wordsRank} nach ausgewerteten Wörtern`,
    });
  }
  if (speaker.drama.interruptedRank && speaker.drama.interruptedRank <= 10) {
    facts.push({
      score: 95 - speaker.drama.interruptedRank,
      text: `#${speaker.drama.interruptedRank} bei erhaltenen Zwischenrufen`,
    });
  }
  if (speaker.rankings.longestSpeechRank <= 10) {
    facts.push({
      score: 80 - speaker.rankings.longestSpeechRank,
      text: `#${speaker.rankings.longestSpeechRank} bei der längsten Rede`,
    });
  }

  return facts;
}

function strongestTransparencyFact(profile?: AbgeordnetenwatchProfile | null): string | null {
  if (!profile) return null;

  const sidejobs = profile.sidejobs ?? [];
  const votesTotal = profile.votes?.total ?? profile.votes?.recent.length ?? 0;
  const questions = profile.politician.questions ?? 0;
  const sidejobsWithIncome = sidejobs.filter(
    (sidejob) => typeof sidejob.income === 'number' || typeof sidejob.incomeLevel === 'number'
  ).length;

  if (sidejobs.length > 0) {
    const incomePart = sidejobsWithIncome > 0
      ? `${sidejobsWithIncome} mit Einkommensangabe`
      : 'ohne hinterlegte Einkommensangaben';
    return `${sidejobs.length} Nebentätigkeiten (${incomePart})`;
  }
  if (votesTotal > 0) return `${votesTotal} namentliche Abstimmungen`;
  if (questions > 0) return `${questions} Bürgerfragen bei Abgeordnetenwatch`;
  return null;
}

export function buildMdbLiveSummary({
  speaker,
  displayName,
  topTopicName,
  signatureWord,
  spiritAnimal,
  abgeordnetenwatch,
  wikipediaIntro,
  fallbackDescription,
}: BuildMdbSummaryInput): string {
  const sentences: string[] = [];
  const intro = firstSentence(wikipediaIntro?.text ?? fallbackDescription?.longText ?? fallbackDescription?.text);
  if (intro) {
    sentences.push(intro);
  }

  const rankFacts = strongestRankFacts(speaker)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((fact) => fact.text);

  if (rankFacts.length > 0) {
    const topicPart = topTopicName ? `; inhaltlich führt ${topTopicName} das Themenprofil an` : '';
    sentences.push(
      normalizeSentence(`Im Bundestag-Wrapped fällt ${displayName} vor allem durch ${joinFacts(rankFacts)} auf${topicPart}`)
    );
  } else if (topTopicName) {
    sentences.push(
      normalizeSentence(`${displayName}s auffälligster inhaltlicher Schwerpunkt im Wrapped-Profil ist ${topTopicName}`)
    );
  }

  const finalFacts: string[] = [];
  const transparencyFact = strongestTransparencyFact(abgeordnetenwatch);
  if (transparencyFact) finalFacts.push(transparencyFact);
  if (signatureWord?.word) finalFacts.push(`das Signaturwort "${signatureWord.word}"`);
  if (spiritAnimal?.name) finalFacts.push(`das Sprachbild "${spiritAnimal.name}"`);

  if (finalFacts.length > 0) {
    sentences.push(normalizeSentence(`Interessant daneben: ${joinFacts(finalFacts)}`));
  }

  if (sentences.length === 0) {
    sentences.push(
      normalizeSentence(`${displayName} ist mit ${speaker.wortbeitraege.toLocaleString('de-DE')} Wortbeiträgen im Bundestag-Wrapped-Datensatz vertreten`)
    );
  }

  return sentences.slice(0, 3).join(' ');
}

export function wikipediaTitleFromDescription(description?: ProfileDescription | null): string | null {
  if (!description?.sourceUrl.includes('wikipedia.org/wiki/')) return null;
  const title = description.sourceUrl.split('/wiki/')[1];
  return title ? decodeURIComponent(title).replace(/_/g, ' ') : null;
}

export async function fetchWikimediaIntro(title: string): Promise<WikimediaIntro> {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts|info',
    titles: title,
    explaintext: '1',
    exintro: '1',
    inprop: 'url',
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  const response = await fetch(`https://de.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Wikimedia summary failed: ${response.status}`);
  }

  const body = await response.json() as {
    query?: {
      pages?: Array<{
        extract?: string;
        fullurl?: string;
        lastrevid?: number;
        touched?: string;
      }>;
    };
  };
  const page = body.query?.pages?.[0];
  if (!page?.extract) {
    throw new Error(`No Wikimedia intro for ${title}`);
  }

  return {
    text: page.extract,
    sourceUrl: page.fullurl ?? `https://de.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
    revision: page.lastrevid ? String(page.lastrevid) : undefined,
    updatedAt: page.touched,
  };
}
