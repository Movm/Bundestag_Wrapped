/**
 * Info slide content - educational context shown between quiz and reveal
 */

export interface InfoSlideContent {
  emoji: string;
  title: string;
  body: string;
}

export const INFO_SLIDES: Record<string, InfoSlideContent> = {
  'info-disclaimer': {
    emoji: '⚠️',
    title: 'Hinweis',
    body: 'Dies ist ein Experiment. Die Daten wurden mit Natural Language Processing analysiert und können fehlerhaft sein.',
  },
  'info-topic-riser': {
    emoji: '📈',
    title: 'Was bedeutet „aufgestiegen“?',
    body: 'Wir vergleichen die Rangfolge der Bundestagsthemen im selben Kalenderzeitraum: jeweils 1. Januar bis 12. Oktober. Je weiter ein Thema gegenüber 2025 nach vorn rückt, desto größer ist sein Aufstieg.',
  },
  'info-word-riser': {
    emoji: '🔤',
    title: 'Wörter im Jahresvergleich',
    body: 'Verglichen werden häufige Wörter, die in beiden Editionen in der Rangliste vorkommen. Neue Einträge werden getrennt erfasst und zählen nicht automatisch als Aufstieg.',
  },
  'info-youth-language': {
    emoji: '🗣️',
    title: 'Wie zählen wir Jugendwörter?',
    body: 'Das aktuelle Jugendwort 2026 ist „Ragebait“ – absichtlich provozierender Inhalt, der Wut und Reaktionen erzeugen soll. Wir prüfen alle 42 unterschiedlichen Top-10-Kandidaten von 2022 bis 2026 sowie vier Ergänzungen. Mehrdeutige Wörter zählen nur, wenn der Kontext zur offiziellen Bedeutung passt.',
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
    title: 'Was macht die Parteien aus?',
    body: 'Signature Words sind Wörter, die eine Partei im Vergleich zu anderen besonders häufig verwendet.',
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
