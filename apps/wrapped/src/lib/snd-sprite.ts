/**
 * UI sounds from SND (https://snd.dev), kit SND01 "sine" by Yasuhiro Tsuchiya,
 * taken from the `snd-lib` package. One sprite file holds every sound; the map
 * gives each sound its start and end in seconds.
 *
 * Licence: the snd-lib code is MIT; the sounds are free for commercial and
 * non-commercial use under the SND terms of use, with the copyright staying
 * with the sound designer and Dentsu Inc. The terms forbid redistributing the
 * unedited files on their own, so they stay in the npm package and are never
 * copied into this repo. They also exclude use for political campaigning;
 * Bundestag Wrapped is a non-partisan data project.
 *
 * Imported lazily by `lib/sounds.ts`; Vite emits the sprite as a hashed asset.
 */
import spriteM4a from 'snd-lib/assets/sounds/sprite/01/audioSprite.m4a?url';
import spriteOgg from 'snd-lib/assets/sounds/sprite/01/audioSprite.ogg?url';
import sprite from 'snd-lib/assets/sounds/sprite/01/audioSprite.json';

/** AAC first (smallest, every engine); Ogg Vorbis if a browser can't decode it. */
export const SPRITE_URLS = [spriteM4a, spriteOgg];

export const SPRITE_MAP: Record<string, { start: number; end: number }> = sprite.spritemap;
