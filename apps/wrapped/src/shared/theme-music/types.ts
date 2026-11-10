/**
 * Shared Theme Music Types and Constants
 *
 * Every background track lives in TRACKS with its file, credit and licence;
 * the credits page (MusicCreditsSection) is generated from it. Which track
 * plays in which section is decided per edition (config/<edition>/music.json,
 * see ./editions.ts); editions without that file use SECTION_THEMES below.
 */

interface License { name: string; url: string }
const CC_BY_NC_ND_4: License = { name: 'CC BY-NC-ND 4.0', url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/' };
const CC_BY_NC_ND_3: License = { name: 'CC BY-NC-ND 3.0', url: 'https://creativecommons.org/licenses/by-nc-nd/3.0/' };
const CC_BY_NC_3: License = { name: 'CC BY-NC 3.0', url: 'https://creativecommons.org/licenses/by-nc/3.0/' };
const CC_BY_SA_3: License = { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' };
// Licensed through the project's Epidemic Sound subscription; no Creative Commons licence.
const EPIDEMIC_LICENSE: License = { name: 'Epidemic Sound Lizenz', url: 'https://www.epidemicsound.com/licensing/' };
const FMA = { name: 'Free Music Archive', url: 'https://freemusicarchive.org' };
const EPIDEMIC = { name: 'Epidemic Sound', url: 'https://www.epidemicsound.com' };
const JAMENDO = { name: 'Jamendo', url: 'https://www.jamendo.com' };
const CLASSICALS = { name: 'Classicals.de', url: 'https://www.classicals.de' };

export interface Track {
  path: string;
  title: string;
  artist: string;
  license: License;
  /** Where the file came from, when its tags name one. */
  source?: { name: string; url: string };
}

export const TRACKS = {
  // 2025 edition
  night: { path: '/sounds/broke-for-free-night-owl.mp3', title: 'Night Owl', artist: 'Broke For Free', license: CC_BY_NC_ND_4, source: FMA },
  mutant: { path: '/sounds/holiznacc0-mutant-club.mp3', title: 'Mutant Club', artist: 'HoliznaCC0', license: CC_BY_NC_ND_4, source: FMA },
  starling: { path: '/sounds/podington-bear-starling.mp3', title: 'Starling', artist: 'Podington Bear', license: CC_BY_NC_ND_4, source: FMA },
  industrial: { path: '/sounds/ikillya-godsize.mp3', title: 'Godsize', artist: 'IKILLYA', license: CC_BY_NC_ND_4, source: FMA },
  spacey: { path: '/sounds/chromix-i-know-youre-out-there.mp3', title: 'I Know You\'re Out There', artist: 'Chromix', license: CC_BY_NC_ND_4, source: FMA },
  playful: { path: '/sounds/kidkanevil-dza-nuff-stickers.mp3', title: 'Nuff Stickers', artist: 'Kidkanevil & DZA', license: CC_BY_NC_ND_4, source: FMA },
  chiptune: { path: '/sounds/kevin-macleod-hyperfun.mp3', title: 'Hyperfun', artist: 'Kevin MacLeod', license: CC_BY_NC_ND_4, source: FMA },
  loveice: { path: '/sounds/lopkerjo-love-others-ice.mp3', title: 'Love Others ICE', artist: 'Lopkerjo', license: CC_BY_NC_ND_4, source: FMA },
  popular: { path: '/sounds/sarah-rasines-cancion-popular.mp3', title: 'Canción Popular', artist: 'Sarah Rasines', license: CC_BY_NC_ND_4, source: FMA },
  reverse: { path: '/sounds/broke-for-free-living-in-reverse.mp3', title: 'Living In Reverse', artist: 'Broke For Free', license: CC_BY_NC_ND_4, source: FMA },
  reflections: { path: '/sounds/jonas-the-plugexpert-apc-reflections-gobot-rmx.mp3', title: 'APC Reflections', artist: 'jonas the plugexpert', license: CC_BY_NC_ND_4, source: FMA },
  hustle: { path: '/sounds/kevin-macleod-hustle.mp3', title: 'Hustle', artist: 'Kevin MacLeod', license: CC_BY_NC_ND_4, source: FMA },
  rhodes: { path: '/sounds/kevin-macleod-dirt-rhodes.mp3', title: 'Dirt Rhodes', artist: 'Kevin MacLeod', license: CC_BY_NC_ND_4, source: FMA },
  // 2026 edition (licences as stated in the files' own tags)
  'only-alone': { path: '/sounds/basxhkzir-only-alone.mp3', title: 'Only Alone', artist: 'BASXHKZIR', license: CC_BY_NC_ND_3, source: JAMENDO },
  saturday: { path: '/sounds/crumbsnatchers-saturday.mp3', title: 'Saturday', artist: 'CrumbSnatchers', license: CC_BY_NC_ND_3, source: JAMENDO },
  'get-popular': { path: '/sounds/toussaint-morrison-get-popular.mp3', title: 'Get Popular', artist: 'Toussaint Morrison', license: CC_BY_NC_3, source: { name: 'Free Music Archive', url: 'https://freemusicarchive.org/music/Toussaint_Morrison/Toussaint_Morrison_Is_Not_My_Boyfriend/Toussaint_Morrison_-_Toussaint_Morrison_Is_Not_My_Boyfriend_-_13_Get_Popular1' } },
  'vivaldi-spring': { path: '/sounds/vivaldi-spring-allegro-john-harrison.mp3', title: 'Vivaldi: Frühling, 1. Satz (Allegro)', artist: 'John Harrison & Wichita State University Chamber Players', license: CC_BY_SA_3, source: CLASSICALS },
  'gloss-that': { path: '/sounds/loreana-gloss-that.mp3', title: 'GLOSS THAT', artist: 'Loreana', license: EPIDEMIC_LICENSE, source: EPIDEMIC },
  pressure: { path: '/sounds/nyck-caution-pressure.mp3', title: 'PRESSURE!', artist: 'Nyck Caution', license: EPIDEMIC_LICENSE, source: EPIDEMIC },
  'i-still-break': { path: '/sounds/parellite-i-still-break.mp3', title: 'I Still Break', artist: 'Parellite', license: EPIDEMIC_LICENSE, source: EPIDEMIC },
  'take-2': { path: '/sounds/mushkilla-take-2-harrison-first-rework.mp3', title: 'Take 2 (Harrison First Rework)', artist: 'Mushkilla & Harrison First', license: EPIDEMIC_LICENSE, source: EPIDEMIC },
} as const satisfies Record<string, Track>;

export type ThemeType = keyof typeof TRACKS;
export const THEME_IDS = Object.keys(TRACKS) as ThemeType[];

export const THEME_PATHS = Object.fromEntries(THEME_IDS.map(id => [id, TRACKS[id].path])) as Record<ThemeType, string>;

export const THEME_TRACK_INFO = Object.fromEntries(
  THEME_IDS.map(id => [id, { title: TRACKS[id].title, artist: TRACKS[id].artist }]),
) as Record<ThemeType, { title: string; artist: string }>;

export const SECTION_THEMES: Record<string, ThemeType> = {
  // Main intro - chill atmospheric start
  intro: 'night',

  // Topics section - electronic club
  topics: 'mutant',
  'party-topics': 'mutant',

  // Vocabulary & Signature section - soft hiphop
  vocabulary: 'reflections',
  signature: 'reflections',

  // Speeches & Speakers section - energetic
  speeches: 'hustle',
  speakers: 'hustle',

  // Drama section - heavy dramatic
  drama: 'industrial',

  // Discriminatory section - serious spacey
  discriminatory: 'spacey',

  // Common words section - mellow smooth
  'common-words': 'rhodes',

  // Moin section - regional folk charm
  moin: 'popular',

  // Swiftie easter egg - chiptune fun
  swiftie: 'chiptune',

  // Tone analysis - mellow reflective
  tone: 'loveice',

  // Gender analysis - funky
  gender: 'playful',

  // Share - energetic
  share: 'hustle',

  // Finale - light airy ending
  finale: 'starling',
};

// Volume settings
export const THEME_VOLUME = 0.35;
export const CROSSFADE_DURATION = 1000; // 1 second

// Track info display settings
export const TRACK_INFO_DISPLAY_DURATION = 3000; // 3 seconds

/** The section a slide belongs to, e.g. 'quiz-topics' → 'topics'. */
export function sectionOfSlide(slideId: string): string {
  return slideId === 'intro' ? 'intro' : slideId.replace(/^(intro|quiz|info|reveal|chart|details)-/, '');
}

/** Default mapping (2025 and every edition without its own music.json). */
export function getThemeForSlide(slideId: string): ThemeType {
  return SECTION_THEMES[sectionOfSlide(slideId)] || 'night';
}
