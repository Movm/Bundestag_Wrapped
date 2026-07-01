/**
 * Shared Theme Music Types and Constants
 *
 * Platform-agnostic theme music definitions.
 * Used by both web (browser Audio) and mobile (expo-av).
 *
 * Track Credits (alphabetical):
 * - Broke For Free: Night Owl, Living In Reverse
 * - Chromix: I Know You're Out There
 * - HoliznaCC0: Mutant Club
 * - IKILLYA: Godsize
 * - jonas the plugexpert: APC Reflections
 * - Kevin MacLeod: Hyperfun, Hustle, Dirt Rhodes
 * - Kidkanevil & DZA: Nuff Stickers
 * - Lopkerjo: Love Others ICE
 * - Podington Bear: Starling
 * - sarah rasines: Canción Popular
 *
 * All tracks from Free Music Archive, licensed CC BY-NC-ND 4.0
 */

export type ThemeType =
  | 'night'       // Broke For Free - Night Owl (chill, atmospheric)
  | 'mutant'      // HoliznaCC0 - Mutant Club (electronic club)
  | 'starling'    // Podington Bear - Starling (light, airy)
  | 'industrial'  // IKILLYA - Godsize (heavy, dramatic)
  | 'spacey'      // Chromix - I Know You're Out There (electronic, serious)
  | 'playful'     // Kidkanevil & DZA - Nuff Stickers (funky, fun)
  | 'chiptune'    // Kevin MacLeod - Hyperfun (chiptune, fun)
  | 'loveice'     // Lopkerjo - Love Others ICE (mellow, reflective)
  | 'popular'     // sarah rasines - canción popular (regional folk)
  | 'reverse'     // Broke For Free - Living In Reverse (chill, reflective)
  | 'reflections' // jonas the plugexpert - APC Reflections (soft hiphop)
  | 'hustle'      // Kevin MacLeod - Hustle (energetic)
  | 'rhodes';     // Kevin MacLeod - Dirt Rhodes (mellow, smooth)

export const THEME_PATHS: Record<ThemeType, string> = {
  night: '/sounds/broke-for-free-night-owl.mp3',
  mutant: '/sounds/holiznacc0-mutant-club.mp3',
  starling: '/sounds/podington-bear-starling.mp3',
  industrial: '/sounds/ikillya-godsize.mp3',
  spacey: '/sounds/chromix-i-know-youre-out-there.mp3',
  playful: '/sounds/kidkanevil-dza-nuff-stickers.mp3',
  chiptune: '/sounds/kevin-macleod-hyperfun.mp3',
  loveice: '/sounds/lopkerjo-love-others-ice.mp3',
  popular: '/sounds/sarah-rasines-cancion-popular.mp3',
  reverse: '/sounds/broke-for-free-living-in-reverse.mp3',
  reflections: '/sounds/jonas-the-plugexpert-apc-reflections-gobot-rmx.mp3',
  hustle: '/sounds/kevin-macleod-hustle.mp3',
  rhodes: '/sounds/kevin-macleod-dirt-rhodes.mp3',
};

export const THEME_TRACK_INFO: Record<ThemeType, { title: string; artist: string }> = {
  night: { title: 'Night Owl', artist: 'Broke For Free' },
  mutant: { title: 'Mutant Club', artist: 'HoliznaCC0' },
  starling: { title: 'Starling', artist: 'Podington Bear' },
  industrial: { title: 'Godsize', artist: 'IKILLYA' },
  spacey: { title: 'I Know You\'re Out There', artist: 'Chromix' },
  playful: { title: 'Nuff Stickers', artist: 'Kidkanevil & DZA' },
  chiptune: { title: 'Hyperfun', artist: 'Kevin MacLeod' },
  loveice: { title: 'Love Others ICE', artist: 'Lopkerjo' },
  popular: { title: 'Canción Popular', artist: 'Sarah Rasines' },
  reverse: { title: 'Living In Reverse', artist: 'Broke For Free' },
  reflections: { title: 'APC Reflections', artist: 'jonas the plugexpert' },
  hustle: { title: 'Hustle', artist: 'Kevin MacLeod' },
  rhodes: { title: 'Dirt Rhodes', artist: 'Kevin MacLeod' },
};

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

/**
 * Get the theme type for a given slide ID
 */
export function getThemeForSlide(slideId: string): ThemeType {
  // Handle main intro slide
  if (slideId === 'intro') {
    return 'night';
  }

  // Extract section from slide ID (e.g., 'quiz-topics' → 'topics')
  const section = slideId.replace(/^(intro|quiz|info|reveal|chart|details)-/, '');
  return SECTION_THEMES[section] || 'night';
}
