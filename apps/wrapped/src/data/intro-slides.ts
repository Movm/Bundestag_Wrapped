/**
 * Intro slide content - shared between web and mobile
 */

export interface IntroSlideContent {
  emoji: string;
  title: string;
  subtitle: string;
}

export const INTRO_SLIDES: Record<string, IntroSlideContent> = {
  'intro-topics': {
    emoji: '📊',
    title: 'Worüber spricht der Bundestag?',
    subtitle: '13 Themen im Fokus',
  },
  'intro-vocabulary': {
    emoji: '📚',
    title: 'Jede Fraktion hat Wörter, die bei ihr auffallen.',
    subtitle: 'Soweit die Themen. Jetzt zu den Wörtern dahinter: Erkennst du eins?',
  },
  'intro-speeches': {
    emoji: '🎤',
    title: 'Manche reden mehr als andere.',
    subtitle: 'Weißt du, wer am längsten am Rednerpult stand?',
  },
  'intro-drama': {
    emoji: '🎭',
    title: 'Im Bundestag wird dazwischengerufen.',
    subtitle: 'Wer stört am meisten?',
  },
  'intro-discriminatory': {
    emoji: '⚠️',
    title: 'Wird der Ton im Bundestag rauer?',
    subtitle: 'Welche Fraktion fällt besonders negativ auf?',
  },
  'intro-common-words': {
    emoji: '📊',
    title: 'Diese Wörter nutzen alle Parteien.',
    subtitle: 'Was war das meistgenutzte Wort?',
  },
  'intro-moin': {
    emoji: '👋',
    title: 'Moin!',
    subtitle: 'Ein wenig Norddeutschland in Berlin.',
  },
  'intro-swiftie': {
    emoji: '💜',
    title: 'Shake it off!',
    subtitle: 'Ein Popstar hat es in den Bundestag geschafft.',
  },
  'intro-tone': {
    emoji: '🎭',
    title: 'Jede Fraktion hat ihren eigenen Ton.',
    subtitle: 'Welches Emoji passt zu diesem Tonfall?',
  },
  'intro-gender': {
    emoji: '👩‍💼',
    title: 'Geschlechterverteilung',
    subtitle: 'Wer spricht wie oft im Bundestag?',
  },
};
