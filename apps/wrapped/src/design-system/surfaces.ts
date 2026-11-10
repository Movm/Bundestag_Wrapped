/**
 * Which coloured field a slide sits on is decided by its role, never per slide.
 * A new slide or quiz only needs an id with the usual prefix and gets the right
 * surface, foreground colours and shapes automatically.
 */
export const SURFACES = ['ink', 'deep', 'violet', 'pink'] as const;
export type Surface = (typeof SURFACES)[number];

export const SLIDE_ROLES = ['cover', 'section', 'quiz', 'info', 'reveal', 'share', 'finale'] as const;
export type SlideRole = (typeof SLIDE_ROLES)[number];

const ROLE_SURFACE: Record<SlideRole, Surface> = {
  cover: 'ink',
  section: 'deep',
  quiz: 'violet',
  info: 'pink',
  reveal: 'ink',
  share: 'pink',
  finale: 'ink',
};

export function slideRole(slideId: string): SlideRole {
  const id = slideId.replace(/^speaker-/, '');
  if (id === 'intro') return 'cover';
  if (id === 'share') return 'share';
  if (id === 'finale') return 'finale';
  if (id.startsWith('quiz')) return 'quiz';
  if (id.startsWith('info')) return 'info';
  if (id.startsWith('intro-')) return 'section';
  return 'reveal';
}

export function surfaceForRole(role: SlideRole): Surface {
  return ROLE_SURFACE[role];
}

export function surfaceForSlide(slideId: string): Surface {
  return surfaceForRole(slideRole(slideId));
}
