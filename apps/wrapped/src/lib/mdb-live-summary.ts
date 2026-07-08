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

function rolePrefix(intro: string): string {
  if (/Bundeskanzler/.test(intro)) return `Als Bundeskanzler`;
  if (/Bundesministerin/.test(intro)) return `Als Bundesministerin`;
  if (/Bundesminister/.test(intro)) return `Als Bundesminister`;
  if (/Fraktionsvorsitzende/.test(intro)) return `Als Fraktionsvorsitzende`;
  if (/Fraktionsvorsitzender/.test(intro)) return `Als Fraktionsvorsitzender`;
  return `In den Plenardaten`;
}

function joinNarrativeClauses(clauses: string[]): string {
  if (clauses.length <= 1) return clauses[0] ?? '';
  if (clauses.length === 2) return `${clauses[0]} und ${clauses[1]}`;
  return `${clauses.slice(0, -1).join(', ')} und ${clauses[clauses.length - 1]}`;
}

function debateProfileSentence(speaker: SpeakerWrapped, displayName: string, intro: string): string {
  const observations: string[] = [];

  if (speaker.drama.interruptedRank && speaker.drama.interruptedRank <= 10) {
    observations.push(`${displayName} wird im Plenum besonders häufig unterbrochen`);
  }
  if (speaker.rankings.wordsRank <= 10) {
    observations.push('prägt die Debatte mit hoher Präsenz');
  }
  if (speaker.rankings.longestSpeechRank <= 10) {
    observations.push('nimmt sich Raum für ausführliche Beiträge');
  }

  const prefix = rolePrefix(intro);
  if (observations.length === 0) {
    return normalizeSentence(`${prefix} zeigt ${displayName} ein eigenständiges parlamentarisches Profil`);
  }

  return normalizeSentence(`${prefix} entsteht ein Bild starker parlamentarischer Sichtbarkeit: ${joinNarrativeClauses(observations)}`);
}

function transparencyPhrase(profile?: AbgeordnetenwatchProfile | null): string | null {
  if (!profile) return null;

  const sidejobs = profile.sidejobs ?? [];
  const sidejobsWithIncome = sidejobs.filter(
    (sidejob) => typeof sidejob.income === 'number' || typeof sidejob.incomeLevel === 'number'
  ).length;

  if (sidejobs.length > 0) {
    return sidejobsWithIncome > 0
      ? 'das Transparenzprofil verweist auf gemeldete Nebentätigkeiten mit Einkommensangaben'
      : 'das Transparenzprofil verweist auf gemeldete Nebentätigkeiten ohne hinterlegte Einkommensangaben';
  }
  if ((profile.votes?.total ?? profile.votes?.recent.length ?? 0) > 0) {
    return 'das Transparenzprofil macht sein Abstimmungsverhalten nachvollziehbar';
  }
  if ((profile.politician.questions ?? 0) > 0) {
    return 'das Transparenzprofil zeigt öffentliche Bürgerfragen';
  }
  return null;
}

function contextSentence({
  topTopicName,
  signatureWord,
  spiritAnimal,
  abgeordnetenwatch,
}: Pick<BuildMdbSummaryInput, 'topTopicName' | 'signatureWord' | 'spiritAnimal' | 'abgeordnetenwatch'>): string | null {
  const topicPart = topTopicName ? `Inhaltlich rückt ${topTopicName} in den Vordergrund` : null;
  const transparency = transparencyPhrase(abgeordnetenwatch);
  const languagePart = signatureWord?.word
    ? `sprachlich wirkt das Profil markant und institutionell`
    : spiritAnimal?.name
      ? `sprachlich wirkt das Profil klar wiedererkennbar`
      : null;

  const parts = [topicPart, languagePart, transparency].filter(Boolean);
  if (parts.length === 0) return null;
  return normalizeSentence(parts.join('; '));
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
  const sourceText = wikipediaIntro?.text ?? fallbackDescription?.longText ?? fallbackDescription?.text ?? '';
  const intro = firstSentence(sourceText);
  if (intro) {
    sentences.push(intro);
  }

  sentences.push(debateProfileSentence(speaker, displayName, sourceText));

  const context = contextSentence({ topTopicName, signatureWord, spiritAnimal, abgeordnetenwatch });
  if (context) sentences.push(context);

  if (sentences.length === 0) {
    sentences.push(
      normalizeSentence(`${displayName} ist im Bundestag-Wrapped-Datensatz mit einem eigenen parlamentarischen Profil vertreten`)
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
