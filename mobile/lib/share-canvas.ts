/**
 * Shared constants and utilities for share canvas rendering
 * Port of web's share-canvas.ts for React Native
 */

// Design tokens (synced with web)
export const BRAND_COLORS = {
  primary: '#db2777',
  secondary: '#ec4899',
  light: '#f472b6',
  gradientStart: '#be185d',
  gradientMid: '#db2777',
  gradientEnd: '#f472b6',
} as const;

export const BG_COLORS = {
  primary: '#0a0a0f',
  secondary: '#12121a',
  card: '#1a1a24',
  elevated: '#242430',
} as const;

export interface ShareImageData {
  correctCount: number;
  totalQuestions: number;
  userName?: string;
}

export interface ResultMessage {
  emoji: string;
  title: string;
  tagline: string;
}

/**
 * Get result message based on score
 */
export function getResultMessage(correctCount: number, totalQuestions: number): ResultMessage {
  // Normalize to 0-10 scale
  const score = Math.round((correctCount / totalQuestions) * 10);

  switch (score) {
    case 10: return {
      emoji: '🏆', title: 'Legende!',
      tagline: 'Perfekt! Du könntest im Bundestag hospitieren.'
    };
    case 9: return {
      emoji: '🏆', title: 'Legende!',
      tagline: 'Deine Eltern wären so stolz auf dich.'
    };
    case 8: return {
      emoji: '🏆', title: 'Legende!',
      tagline: 'Fast makellos – da wackelt der Kanzlerstuhl.'
    };
    case 7: return {
      emoji: '🌟', title: 'Demokratie-Star!',
      tagline: 'Mit dir würden wir in eine Koalition gehen.'
    };
    case 6: return {
      emoji: '🌟', title: 'Demokratie-Star!',
      tagline: 'Solide! Die Fraktion wäre beeindruckt.'
    };
    case 5: return {
      emoji: '🚀', title: 'Politik-Talent!',
      tagline: 'Die Hälfte ist geschafft, weiter so!'
    };
    case 4: return {
      emoji: '🚀', title: 'Politik-Talent!',
      tagline: 'Du bist auf einem guten Weg, bleib dran!'
    };
    case 3: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: 'Rom wurde auch nicht an einem Tag erbaut.'
    };
    case 2: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: 'Jeder Profi hat mal klein angefangen.'
    };
    case 1: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: 'Ein Punkt ist besser als kein Punkt!'
    };
    default: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: "Nächstes Mal wird's besser, versprochen!"
    };
  }
}

/**
 * Generate text lines for hero section (variant 1: with emoji)
 */
export function getHeroLines(name: string | undefined, result: ResultMessage): { line1: string; line2: string } {
  const trimmedName = name?.trim();
  // Short names (≤14 chars): "Moritz, du bist" | Long names: "Moritz ist"
  const line1 = trimmedName
    ? (trimmedName.length <= 14 ? `${trimmedName}, du bist` : `${trimmedName} ist`)
    : 'Du bist';
  const line2 = `${result.title} ${result.emoji}`;
  return { line1, line2 };
}

/**
 * Generate text lines for hero section (variant 2: simplified)
 * Format: "Moritz, du bist eine:" or "Du bist eine:" (no second line)
 */
export function getHeroLinesVariant2(name: string | undefined, _result: ResultMessage): { line1: string; line2: string } {
  const trimmedName = name?.trim();
  const line1 = trimmedName
    ? `${trimmedName}, du bist eine:`
    : 'Du bist eine:';
  const line2 = ''; // No second line in this variant
  return { line1, line2 };
}
