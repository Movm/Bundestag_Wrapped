export type PartyTopicScores = Record<string, Record<string, number>>;

/** Selects display candidates strictly from their measured topic scores. */
export function selectDisplayParties(byParty: PartyTopicScores, limit = 5): string[] {
  return Object.entries(byParty)
    .filter(([party]) => party !== 'fraktionslos')
    .map(([party, topics]) => ({ party, score: Object.values(topics).reduce((sum, value) => sum + value, 0) }))
    .sort((a, b) => b.score - a.score || a.party.localeCompare(b.party, 'de'))
    .slice(0, limit)
    .map(({ party }) => party);
}
