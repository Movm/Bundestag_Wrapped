/**
 * End Slide Content
 * German copy for the final slide - shared between web and mobile.
 */

export const END_SLIDE_CONTENT = {
  header: {
    label: 'Das war',
    title: 'Bundestag Wrapped',
  },

  message: {
    primary:
      'Die meisten demokratischen Politiker:innen leisten harte Arbeit für unser Land – unabhängig von ihrer Partei. Danke dafür!',
    secondary:
      'Dies ist ein Spaßprojekt und keine wissenschaftliche Analyse. Mehr zur Methodik findest du in der Dokumentation oder auf GitHub.',
  },

  buttons: {
    restart: 'Nochmal starten',
    speakers: 'Abgeordnete',
    documentation: 'Dokumentation',
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
