import { getThemeForSlide as defaultThemeForSlide, sectionOfSlide, TRACKS, type ThemeType } from './types';

/**
 * Per-edition music: `config/<edition>/music.json` picks a track (an id from
 * TRACKS) per story section, plus a default for sections it does not list.
 * Editions without the file keep the original mapping in SECTION_THEMES.
 */
export interface EditionMusic {
  version: 1;
  default: ThemeType;
  sections: Record<string, ThemeType>;
}

function isTrack(value: unknown): value is ThemeType {
  return typeof value === 'string' && Object.hasOwn(TRACKS, value);
}

export function parseEditionMusic(value: unknown, source: string): EditionMusic {
  const config = value as Partial<EditionMusic> | null;
  if (!config || config.version !== 1 || !isTrack(config.default) || typeof config.sections !== 'object' || config.sections === null) {
    throw new Error(`${source}: expected { version: 1, default: <track>, sections: { … } }`);
  }
  for (const [section, track] of Object.entries(config.sections)) {
    if (!isTrack(track)) throw new Error(`${source}: unknown track "${String(track)}" for section "${section}"`);
  }
  return config as EditionMusic;
}

const files = import.meta.glob<unknown>('/config/*/music.json', { eager: true, import: 'default' });

export const EDITION_MUSIC: Record<string, EditionMusic> = Object.fromEntries(
  Object.entries(files).map(([file, value]) => [file.split('/')[2], parseEditionMusic(value, file)]),
);

/** The track for a slide in a given edition. */
export function themeForSlide(slideId: string, editionId?: string | null): ThemeType {
  const music = editionId ? EDITION_MUSIC[editionId] : undefined;
  if (!music) return defaultThemeForSlide(slideId);
  return music.sections[sectionOfSlide(slideId)] ?? music.default;
}
