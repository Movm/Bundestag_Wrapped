export const SITE_CONFIG = {
  siteName: 'Bundestag Wrapped',
  siteUrl: 'https://bundestag-wrapped.de',
  defaultTitle: 'Bundestag Wrapped – Deine Bundestagsstatistiken',
  defaultDescription:
    'Entdecke die Sprache des Bundestags mit interaktiven, editionsbasierten Statistiken.',
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
      'Datenschutzerklärung für Bundestag Wrapped. Keine Cookies und keine verpflichtende Datenerhebung.',
  },
  terms: {
    title: 'Nutzungsbedingungen',
    description:
      'Nutzungsbedingungen für Bundestag Wrapped: Hinweise zu Datenquellen, Nutzung, MCP-Server, Lizenzen und Haftung.',
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
      'Methodik und technische Dokumentation zu Bundestag Wrapped. Erfahre, wie die Sprachanalyse funktioniert.',
  },
} as const;
