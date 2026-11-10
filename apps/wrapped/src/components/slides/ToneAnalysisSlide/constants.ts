import type { PartyProfile } from '@/data/wrapped';

export const PARTY_ORDER = [
  'DIE LINKE',
  'BSW',
  'SPD',
  'GRÜNE',
  'CDU/CSU',
  'AfD',
  'fraktionslos',
];

export function sortParties(
  profiles: Record<string, PartyProfile>
): PartyProfile[] {
  const entries = Object.values(profiles);
  return entries.sort((a, b) => {
    const indexA = PARTY_ORDER.indexOf(a.party);
    const indexB = PARTY_ORDER.indexOf(b.party);
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });
}

export const TONE_CATEGORIES = [
  { key: 'aggression', emoji: '😤', label: 'Aggressiv' },
  { key: 'collaboration', emoji: '🤗', label: 'Kooperativ' },
  { key: 'labeling', emoji: '🧐', label: 'Etikettierend' },
  { key: 'solutionFocus', emoji: '🤓', label: 'Lösungsorientiert' },
  { key: 'demandIntensity', emoji: '😏', label: 'Fordernd' },
  { key: 'affirmative', emoji: '😊', label: 'Positiv' },
] as const;
