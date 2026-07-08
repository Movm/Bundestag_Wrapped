import type { SpeakerWrapped, SignatureWord } from '@/data/speaker-wrapped';
import type { Speech } from '@/lib/search-utils';

const TITLE_PREFIX_RE = /^(?:(?:Prof\.?|Dr\.?)\s+)+/i;

export function speakerSlug(name: string): string {
  let slug = name.replace(TITLE_PREFIX_RE, '').trim();
  slug = slug
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'ae')
    .replace(/Ö/g, 'oe')
    .replace(/Ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug;
}

export function displaySpeakerName(speaker: Pick<SpeakerWrapped, 'name' | 'academicTitle'>): string {
  if (!speaker.academicTitle) {
    return speaker.name;
  }

  const titlePattern = new RegExp(`^${speaker.academicTitle.replace('.', '\\.')}\\.?\\s+`, 'i');
  if (titlePattern.test(speaker.name)) {
    return speaker.name;
  }
  return `${speaker.academicTitle} ${speaker.name}`;
}

function normalizeSignatureWord(word: SignatureWord, ratioKey: 'ratioParty' | 'ratioBundestag'): SignatureWord {
  const ratio = word.ratio ?? word[ratioKey] ?? 0;
  const score = word.score ?? (ratio > 0 ? Math.round(word.count * Math.log(ratio + 1) * 100) / 100 : 0);
  return {
    ...word,
    ratio,
    score,
  };
}

export function signatureWordsForDisplay(
  speaker: SpeakerWrapped,
  scope: 'party' | 'bundestag' = 'bundestag'
): SignatureWord[] {
  const ratioKey = scope === 'party' ? 'ratioParty' : 'ratioBundestag';
  const modern = scope === 'party'
    ? speaker.words.signatureWordsParty
    : speaker.words.signatureWordsBundestag;
  const legacy = speaker.words.signatureWords;

  return (modern ?? legacy ?? [])
    .map((word) => normalizeSignatureWord(word, ratioKey))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function signatureAdjectivesForDisplay(
  speaker: SpeakerWrapped,
  scope: 'party' | 'bundestag' = 'bundestag'
): SignatureWord[] {
  const ratioKey = scope === 'party' ? 'ratioParty' : 'ratioBundestag';
  const modern = scope === 'party'
    ? speaker.words.signatureAdjectivesParty
    : speaker.words.signatureAdjectivesBundestag;
  const legacy = speaker.words.signatureAdjectives;

  return (modern ?? legacy ?? [])
    .map((word) => normalizeSignatureWord(word, ratioKey))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function speechesForSpeaker(speeches: Speech[], speaker: SpeakerWrapped): Speech[] {
  const targetName = speaker.name.toLowerCase();
  const targetDisplayName = displaySpeakerName(speaker).toLowerCase();
  const targetSlug = speakerSlug(speaker.name);
  const targetDisplaySlug = speakerSlug(displaySpeakerName(speaker));

  return speeches.filter((speech) => {
    const speechName = speech.speaker.toLowerCase();
    const speechSlug = speakerSlug(speech.speaker);
    return (
      speechName === targetName ||
      speechName === targetDisplayName ||
      speechSlug === targetSlug ||
      speechSlug === targetDisplaySlug
    );
  });
}

export function speechTypeLabel(speech: Pick<Speech, 'type' | 'category'>): string {
  if (speech.type === 'rede') return 'Rede';
  if (speech.type === 'befragung') return 'Befragung';
  if (speech.type === 'fragestunde_antwort') return 'Fragestunde';
  if (speech.type === 'zwischenfrage') return 'Zwischenfrage';
  if (speech.category === 'wortbeitrag') return 'Wortbeitrag';
  return speech.type || 'Beitrag';
}
