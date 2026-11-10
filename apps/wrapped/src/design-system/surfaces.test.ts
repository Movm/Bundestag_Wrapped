import { describe, expect, it } from 'vitest';
import { SLIDES } from '@/components/main-wrapped/constants';
import { SPEAKER_SLIDES } from '@/components/speaker-wrapped/constants';
import { slideRole, surfaceForSlide } from './surfaces';

describe('slide surfaces', () => {
  it('derives the surface from the slide role', () => {
    expect(surfaceForSlide('intro')).toBe('ink');
    expect(surfaceForSlide('info-disclaimer')).toBe('pink');
    expect(surfaceForSlide('quiz-topic-riser')).toBe('violet');
    expect(surfaceForSlide('intro-topics')).toBe('deep');
    expect(surfaceForSlide('reveal-topic-risers')).toBe('ink');
    expect(surfaceForSlide('chart-speeches')).toBe('ink');
  });

  it('gives a quiz the edition defines itself the quiz surface', () => {
    expect(surfaceForSlide('quiz-who-said-ragebait')).toBe('violet');
  });

  it('maps speaker slides like story slides', () => {
    expect(slideRole('speaker-intro')).toBe('cover');
    expect(slideRole('speaker-quiz')).toBe('quiz');
    expect(slideRole('speaker-share')).toBe('share');
    expect(slideRole('speaker-words')).toBe('reveal');
  });

  it('covers every slide that exists', () => {
    for (const id of [...SLIDES, ...SPEAKER_SLIDES]) expect(surfaceForSlide(id)).toMatch(/^(ink|deep|violet|pink)$/);
  });
});
