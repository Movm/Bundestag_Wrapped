import { describe, expect, it } from 'vitest';
import { EDITION_MUSIC, parseEditionMusic, themeForSlide } from './editions';
import { THEME_IDS, TRACKS, getThemeForSlide } from './types';

describe('edition music', () => {
  it('ships a file for every track', () => {
    const files = new Set(Object.keys(import.meta.glob('/public/sounds/*.mp3')).map(file => file.replace(/^\/public/, '')));
    const missing = THEME_IDS.filter(id => !files.has(TRACKS[id].path));
    expect(missing).toEqual([]);
  });

  it('loads the 2026 music.json', () => {
    expect(Object.keys(EDITION_MUSIC)).toContain('2026');
    // Music starts with "Los geht’s", so the cover and disclaimer already carry the first story track.
    expect(themeForSlide('intro', '2026')).toBe('pressure');
    expect(themeForSlide('info-disclaimer', '2026')).toBe('pressure');
    expect(themeForSlide('quiz-youth-language', '2026')).toBe('only-alone');
    expect(themeForSlide('quiz-genz', '2026')).toBe('only-alone');
    expect(themeForSlide('reveal-mention', '2026')).toBe('i-still-break');
    expect(themeForSlide('finale', '2026')).toBe('vivaldi-spring');
  });

  it('falls back to the edition default for an unlisted section', () => {
    expect(themeForSlide('reveal-drama', '2026')).toBe(EDITION_MUSIC['2026'].default);
  });

  it('keeps the original mapping for editions without music.json', () => {
    expect(themeForSlide('reveal-drama', '2025')).toBe(getThemeForSlide('reveal-drama'));
    expect(themeForSlide('intro', null)).toBe('night');
  });

  it('rejects unknown tracks', () => {
    expect(() => parseEditionMusic({ version: 1, default: 'night', sections: { intro: 'nope' } }, 'x')).toThrow(/unknown track "nope"/);
    expect(() => parseEditionMusic({ version: 1, default: 'nope', sections: {} }, 'x')).toThrow();
  });
});
