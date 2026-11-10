/**
 * End Slide Content
 * German copy for the final web slide.
 */

export const END_SLIDE_CONTENT = {
  header: {
    label: 'Dein Bundestagsjahr',
    title: 'Bundestag Wrapped',
  },

  message: {
    primary:
      'Hinter jeder Zahl stecken Menschen, die sich im Plenum zusammenraufen. Danke an alle Abgeordneten, die dafür im Plenum stehen.',
    secondary:
      'Ein Spaßprojekt, keine wissenschaftliche Analyse. Wie wir zählen, steht in der Dokumentation.',
  },

  buttons: {
    restart: 'Nochmal spielen',
    speakers: 'Abgeordnete',
    documentation: 'Wie wir zählen',
    github: 'GitHub',
  },

  socialLinks: [
    {
      url: 'https://github.com/Movm/bundestag-wrapped',
      label: 'GitHub',
    },
    {
      url: 'https://www.linkedin.com/in/moritz-w%C3%A4chter-6ab033210/',
      label: 'LinkedIn',
    },
    {
      url: 'https://x.com/MoritzWaech',
      label: 'X',
    },
    {
      url: 'https://www.instagram.com/moritz_waechter/',
      label: 'Instagram',
    },
  ],
} as const;

/** Reader type by share of correct quiz answers, shown on the end slide. */
const QUIZ_TIERS = [
  { min: 0.76, label: 'Parlamentsprofi', line: 'So viel Gespür hat nicht jeder Abgeordnete.' },
  { min: 0.51, label: 'Stammgast im Plenum', line: 'Du weißt, wer wo sitzt.' },
  { min: 0.26, label: 'Zuschauer:in auf der Tribüne', line: 'Bald bist du Stammgast.' },
  { min: 0, label: 'Frischer Besuch', line: 'Das Beste kommt noch.' },
] as const;

export function quizTier(correct: number, total: number): (typeof QUIZ_TIERS)[number] | null {
  if (total <= 0) return null;
  const share = correct / total;
  return QUIZ_TIERS.find(tier => share >= tier.min) ?? null;
}
