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
  'info-topics': {
    emoji: '📊',
    title: 'Themen-Analyse',
    body: 'Wir haben alle Bundestagsreden analysiert und 13 Themenbereiche identifiziert – von Finanzen über Klima bis Justiz. Aber worüber spricht Berlin?',
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
    body: 'Friedrich Merz führt die Redezeit-Statistik an – als Kanzler beantwortet er viele Fragen in der Fragestunde. Die längste Einzelrede hielt jedoch Lars Klingbeil mit 5.977 Wörtern (knapp vor Merz).',
  },
  'info-drama': {
    emoji: '🎭',
    title: 'Zwischenrufe im Bundestag',
    body: 'Zwischenrufe sind spontane Reaktionen während Reden - Positiv oder Negativ. Oppositionsparteien rufen häufiger dazwischen – die AfD als größte Oppositionsfraktion führt diese Statistik an. Überdeutlich.',
  },
  'info-moin': {
    emoji: '🌊',
    title: 'Der SSW im Bundestag',
    body: "Stefan Seidler vertritt den Südschleswigschen Wählerverband (SSW) – die Partei der dänischen und friesischen Minderheiten, die seit 2021 wieder im Bundestag sitzt. Für diese gilt die 5-Prozent-Hürde nicht.",
  },
  'info-tone': {
    emoji: '🎭',
    title: 'Tonfall-Profile',
    body: 'Jede Fraktion hat einen eigenen sprachlichen Stil. Wir messen sieben Dimensionen – von kooperativ bis fordernd, von lösungsorientiert bis konfrontativ – und fassen sie zu einem Persönlichkeitsprofil zusammen.',
  },
  'info-gender': {
    emoji: '👩‍💼',
    title: 'Redezeit nach Geschlecht',
    body: 'Der Frauenanteil bei Bundestagsreden variiert stark zwischen Fraktionen. Dies hängt von der Zusammensetzung der Fraktion, internen Strukturen und Themenschwerpunkten ab. Der Frauenanteil sank im Bundestag zuletzt, vor allem durch die AfD.',
  },
  'info-discriminatory': {
    emoji: '⚠️',
    title: 'Diskriminierende Sprache',
    body: 'Wir tracken vier Kategorien: fremdenfeindlich (z.B. "Überfremdung"), homophob (z.B. "Genderideologie"), islamophob (z.B. "Islamisierung") und Dog Whistles (z.B. "Remigration"). Aber wie oft verwenden die Parteien diskriminierende oder herablassende Sprache pro 1000 Wörter?',
  },
};
