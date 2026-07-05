export const SITE_CONFIG = {
  siteName: 'Bundestag Wrapped 2025',
  siteUrl: 'https://bundestag-wrapped.de',
  defaultTitle: 'Bundestag Wrapped 2025 - Deine Bundestagsstatistiken',
  defaultDescription:
    'Entdecke die Sprache des Bundestags: 2,5 Millionen Worter, 4.200 Reden, 600 Abgeordnete. Interaktive Statistiken zur 21. Wahlperiode.',
  defaultOgImage: '/og-image.png',
} as const;

export const PAGE_META = {
  home: {
    title: null, // Uses default title
    description: SITE_CONFIG.defaultDescription,
  },
  search: {
    title: 'Suche',
    description:
      'Durchsuche alle Bundestagsreden nach Abgeordneten, Themen und Wortern. Uber 4.200 Reden aus der 21. Wahlperiode durchsuchbar.',
  },
  speakers: {
    title: 'Abgeordnete',
    description:
      'Finde deinen Bundestagsabgeordneten und entdecke personliche Statistiken. 600+ Abgeordnete mit individuellen Wrapped-Profilen.',
  },
  privacy: {
    title: 'Datenschutz',
    description:
      'Datenschutzerklarung fur Bundestag Wrapped 2025. Keine Cookies, kein Tracking, keine Datenerhebung.',
  },
  mcp: {
    title: 'MCP-Server',
    description:
      'Verbinde Claude, ChatGPT oder Mistral mit dem echten Bundestag: Drucksachen, Reden, Gesetzgebung und Abstimmungen. Kostenlos, ohne Anmeldung.',
  },
  mcpTechnik: {
    title: 'MCP-Server — Technische Details',
    description:
      'Technische Referenz des Bundestag-MCP-Servers: 38 nur-lesende Tools, Filter, Sortierung, Endpoint und Datenquellen fur Entwickler:innen.',
  },
  documentation: {
    title: 'Dokumentation',
    description:
      'Methodik und technische Dokumentation zu Bundestag Wrapped 2025. Erfahre wie die Sprachanalyse funktioniert.',
  },
} as const;
