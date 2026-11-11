import type { ChancellorArea } from '@/generated/wrapped-contract-v1';
import { TOPIC_BY_ID } from '@/shared/constants/topics';

/**
 * Innen- oder Außenkanzler? The pipeline (edition/chancellor.py) counts the
 * topic words of the chancellor's own speeches and Befragung answers and puts
 * every topic on a side. This module only rounds and words those numbers.
 */

/** The two areas the pipeline splits out of "sicherheit" and "wirtschaft". */
const EXTRA_AREAS: Record<string, string> = { verteidigung: 'Verteidigung', aussenhandel: 'Außenhandel' };

export function areaName(id: string): string {
  return EXTRA_AREAS[id] ?? TOPIC_BY_ID[id]?.name ?? id;
}

export const sideName = (side: ChancellorArea['side']) => (side === 'aussen' ? 'Außen' : 'Innen');

/** Whole percent, the way every slide shows a share. */
export const percent = (share: number) => Math.round(share);

/** The foreign and domestic share as whole numbers that add up to 100. */
export function split(share: number): { foreign: number; domestic: number } {
  const foreign = percent(share);
  return { foreign, domestic: 100 - foreign };
}

/** "Merz" from "Friedrich Merz", "Dr. Angela Merkel" → "Merkel". */
export const lastName = (name: string) => name.split(/\s+/).filter(Boolean).at(-1) ?? name;

export interface Verdict {
  side: 'innen' | 'aussen' | 'beides';
  /** Within ten points of half: "Knapp." */
  close: boolean;
}

export function chancellorVerdict(share: number): Verdict {
  const foreign = percent(share);
  if (foreign === 50) return { side: 'beides', close: true };
  return { side: foreign > 50 ? 'aussen' : 'innen', close: Math.abs(foreign - 50) <= 10 };
}

const decimal = (value: number) => value.toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** "rund doppelt so", "rund dreimal so", otherwise "2,8-mal so". */
export function timesAs(ratio: number): string {
  if (Math.abs(ratio - 2) <= 0.15) return 'rund doppelt so';
  if (Math.abs(ratio - 3) <= 0.15) return 'rund dreimal so';
  return `${decimal(ratio)}-mal so`;
}

/**
 * How an area compares with the rest of the chamber, per 1,000 words.
 * `short` drops the comparison once the first entry has named it.
 */
export function againstChamber(area: ChancellorArea, short = false): string {
  if (area.chamberPerThousand <= 0) return short ? 'sonst kaum ein Thema' : 'im restlichen Bundestag kaum ein Thema';
  const ratio = area.perThousand / area.chamberPerThousand;
  if (ratio >= 1.1) return `${timesAs(ratio)} oft${short ? '' : ' wie im restlichen Bundestag'}`;
  if (ratio <= 0.9) return short ? 'seltener als der Rest' : 'seltener als im restlichen Bundestag';
  return short ? 'etwa so oft wie der Rest' : 'etwa so oft wie im restlichen Bundestag';
}

/**
 * Answer options for the share question: the real share and three others
 * 14 points apart, nearest first, all between 1 and 99 %.
 */
export function shareOptions(share: number): string[] {
  const answer = percent(share);
  const distractors = [answer - 14, answer + 14, answer - 28, answer + 28, answer + 42, answer - 42]
    .filter(value => value >= 1 && value <= 99)
    .slice(0, 3);
  return [answer, ...distractors].map(value => `${value} %`);
}

const ratioOf = (area: ChancellorArea) => (area.chamberPerThousand > 0 ? area.perThousand / area.chamberPerThousand : 0);

/**
 * The area that sets him apart: of his three biggest areas, the one he talks
 * about most often compared with the rest of the chamber. Null without areas.
 */
export function focusArea(areas: readonly ChancellorArea[]): { area: ChancellorArea; ratio: number } | null {
  const [area] = [...areas.slice(0, 3)].sort((a, b) => ratioOf(b) - ratioOf(a));
  return area ? { area, ratio: ratioOf(area) } : null;
}

/** "Europa" from "Europa/Außen": the word in front of "-Kanzler". */
export const focusName = (id: string) => areaName(id).split('/')[0];
