import { cardinal } from '@/lib/german-count';

/**
 * Info slide content - educational context shown between quiz and reveal
 */

export interface InfoSlideContent {
  emoji: string;
  title: string;
  body: string;
  /** Small label above the title; defaults to "Kurz erklärt". */
  eyebrow?: string;
  /** Exact phrase inside `body` to set as a highlighted block. */
  highlight?: string;
}

export const INFO_SLIDES: Record<string, InfoSlideContent> = {
  'info-disclaimer': {
    emoji: '🧮',
    title: 'Wir haben mitgezählt.',
    eyebrow: 'Kurz, bevor’s losgeht',
    body: 'Unsere Zahlen kommen aus den Plenarprotokollen. Für alle Fraktionen gelten dieselben Regeln. Wie wir zählen, erklären wir unterwegs.',
    highlight: 'Für alle Fraktionen gelten dieselben Regeln.',
  },
  'info-topic-riser': {
    emoji: '📈',
    title: 'Wie kommt ein Thema nach oben?',
    body: 'Wir zählen passende Begriffe und setzen sie ins Verhältnis zu allen gesprochenen Wörtern. Je größer der Anteil, desto höher der Platz.',
  },
  'info-word-riser': {
    emoji: '🔤',
    title: 'Wörter im Jahresvergleich',
    body: 'Verglichen werden häufige Wörter, die in beiden Editionen in der Rangliste vorkommen. Neue Einträge werden getrennt erfasst und zählen nicht automatisch als Aufstieg.',
  },
  'info-youth-language': {
    emoji: '🗣️',
    title: 'Jugendsprache trifft Plenarprotokoll.',
    body: 'Wir haben nach Begriffen aus der Jugendwort-Auswahl gesucht. Zitate zählen mit. Bei mehrdeutigen Wörtern prüfen wir den Zusammenhang.',
  },
  'info-topics': {
    emoji: '📊',
    title: 'Themen-Analyse',
    body: 'Wir analysieren die Themen der Reden dieser Edition und machen ihre Schwerpunkte vergleichbar.',
  },
  'info-party-topics': {
    emoji: '',
    title: 'Und die Parteien?',
    body: 'Jede Fraktion hat ihre eigenen Schwerpunkte. Manche Ergebnisse sind erwartbar – andere vielleicht nicht.',
  },
  'info-signature': {
    emoji: '📊',
    title: 'Was macht ein Wort typisch?',
    body: 'Es fällt in einer Fraktion häufig – und deutlich häufiger als bei den anderen. Beides zusammen bestimmt den Platz in unserer Liste.',
  },
  'info-speeches': {
    emoji: '🎤',
    title: 'Wer redet am meisten?',
    body: 'Die Frage nutzt die in dieser Edition gemessene Gesamtwortzahl je Person. Einzelreden werden dafür nicht als eigene Rangliste behauptet.',
  },
  'info-drama': {
    emoji: '🎭',
    title: 'Zwischenrufe im Bundestag',
    body: 'Zwischenrufe sind spontane Reaktionen während Reden. Die Auswertung zeigt die gezählten Werte dieser Edition, ohne daraus eine allgemeine politische Regel abzuleiten.',
  },
  'info-moin': {
    emoji: '🌊',
    title: 'Der SSW im Bundestag',
    body: 'Die Optionen stammen ausschließlich aus den in dieser Edition gezählten Personen. Es werden keine zusätzlichen Namen ergänzt.',
  },
  'info-tone': {
    emoji: '🎭',
    title: 'Tonfall-Profile',
    body: 'Jede Fraktion hat einen eigenen sprachlichen Stil. Wir messen sieben Dimensionen – von kooperativ bis fordernd, von lösungsorientiert bis konfrontativ – und fassen sie zu einem Persönlichkeitsprofil zusammen.',
  },
  'info-gender': {
    emoji: '👩‍💼',
    title: 'Redezeit nach Geschlecht',
    body: 'Der Frauenanteil bei Bundestagsreden variiert zwischen Fraktionen. Die Einordnung bezieht sich ausschließlich auf die Daten dieser Edition.',
  },
  'info-discriminatory': {
    emoji: '⚠️',
    title: 'Diskriminierende Sprache',
    body: 'Wir tracken vier Kategorien: fremdenfeindlich (z.B. "Überfremdung"), homophob (z.B. "Genderideologie"), islamophob (z.B. "Islamisierung") und Dog Whistles (z.B. "Remigration"). Aber wie oft verwenden die Parteien diskriminierende oder herablassende Sprache pro 1000 Wörter?',
  },
};

/** What the edition's data adds to the static info slides (years, counts). */
export interface InfoSlideContext {
  year?: number | null;
  baselineYear?: string | null;
  /** Candidates of the Jugendwort lexicon this edition searched for. */
  youthWordCount?: number;
  /** Jugendwörter of earlier years are counted too. */
  hasPastWinners?: boolean;
}

/** The info slide with the numbers its text names filled in from the data. */
export function resolveInfoSlide(slide: string, context: InfoSlideContext): InfoSlideContent {
  const content = INFO_SLIDES[slide];
  if (slide === 'info-topic-riser') {
    const period = context.baselineYear && context.year
      ? `Verglichen wird derselbe Zeitraum ${context.baselineYear} und ${context.year}.`
      : 'Verglichen wird jeweils derselbe Zeitraum des Vorjahres.';
    return { ...content, body: `${content.body} ${period}` };
  }
  if (slide === 'info-youth-language') {
    const count = context.youthWordCount && context.youthWordCount > 1 ? ` ${cardinal(context.youthWordCount)}` : '';
    const history = context.hasPastWinners ? ' Dazu kommen die Jugendwörter früherer Jahre.' : '';
    return {
      ...content,
      body: `Wir haben nach${count} Begriffen aus der Jugendwort-Auswahl gesucht.${history} Zitate zählen mit. Bei mehrdeutigen Wörtern prüfen wir den Zusammenhang.`,
    };
  }
  return content;
}
