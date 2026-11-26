import type { Mention } from '@/generated/wrapped-contract-v1';

/**
 * Each mention story reads its mention by id from `config/<edition>/mentions.json`,
 * never by position: the pipeline drops a mention nobody made, so positions shift.
 */
export const WHALE_MENTION_ID = 'timmy';
export const GTA_MENTION_ID = 'gta-6';

export function findMention(mentions: readonly Mention[] | null | undefined, id: string): Mention | undefined {
  return mentions?.find(mention => mention.id === id);
}
