export interface QuizQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

export interface QuizResult {
  emoji: string;
  name: string;
  title: string;
  reason: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  color: string;
  description: string;
  examples: string[];
  pattern: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'speaking',
    question: 'Wie oft würdest du im Bundestag reden?',
    options: [
      { value: 'often', label: 'So oft wie möglich – ich habe viel zu sagen!' },
      { value: 'sometimes', label: 'Regelmäßig, aber nur wenn es wichtig ist' },
      { value: 'rarely', label: 'Selten, aber dann ausführlich' },
    ],
  },
  {
    id: 'length',
    question: 'Wie lang wären deine Reden?',
    options: [
      { value: 'long', label: 'Ausführlich – jedes Detail zählt' },
      { value: 'medium', label: 'Normal – auf den Punkt' },
      { value: 'short', label: 'Kurz und präzise' },
    ],
  },
  {
    id: 'interruptions',
    question: 'Wie gehst du mit Zwischenrufen um?',
    options: [
      { value: 'give', label: 'Ich rufe selbst gerne dazwischen!' },
      { value: 'receive', label: 'Ich werde oft unterbrochen, rede aber weiter' },
      { value: 'avoid', label: 'Ich bleibe diplomatisch und sachlich' },
    ],
  },
  {
    id: 'specialty',
    question: 'Hast du Spezialthemen?',
    options: [
      { value: 'expert', label: 'Ja, ich bin Expert:in für mein Thema' },
      { value: 'some', label: 'Ein paar Themen liegen mir besonders am Herzen' },
      { value: 'broad', label: 'Ich spreche zu vielen verschiedenen Themen' },
    ],
  },
];

export function calculateAnimal(answers: Record<string, string>): QuizResult {
  const { speaking, length, interruptions, specialty } = answers;

  if (speaking === 'often' && length === 'long') {
    return { emoji: '🐘', name: 'Elefant', title: 'Wortgewaltige:r Redner:in', reason: 'Du redest viel und ausführlich – ein echtes Schwergewicht im Parlament!' };
  }
  if (speaking === 'often' && (length === 'medium' || length === 'long')) {
    return { emoji: '🦅', name: 'Adler', title: 'Parlamentarischer Überflieger', reason: 'Du bist aktiv und präsent – ein Allrounder mit Überblick!' };
  }
  if (specialty === 'expert') {
    return { emoji: '🦉', name: 'Eule', title: 'Themenexpert:in', reason: 'Dein Fachwissen macht dich unersetzlich in Debatten!' };
  }
  if (interruptions === 'give') {
    return { emoji: '🐺', name: 'Wolf', title: 'Mutiger Einwerfer', reason: 'Du scheust dich nicht, dazwischenzurufen – mutig und direkt!' };
  }
  if (interruptions === 'receive') {
    return { emoji: '🐻', name: 'Bär', title: 'Standhafter Debattierer', reason: 'Du lässt dich nicht beirren und stehst zu deiner Meinung!' };
  }
  if (length === 'long' && speaking !== 'often') {
    return { emoji: '🦚', name: 'Pfau', title: 'Eloquente:r Redner:in', reason: 'Wenn du redest, dann richtig – mit Stil und Substanz!' };
  }
  if (speaking === 'often' && length === 'short') {
    return { emoji: '🐦', name: 'Kolibri', title: 'Präziser Wortführer', reason: 'Viele Beiträge, aber immer auf den Punkt – effizient!' };
  }
  if (interruptions === 'avoid' && speaking === 'sometimes') {
    return { emoji: '🐬', name: 'Delfin', title: 'Diplomatische:r Redner:in', reason: 'Du bist aktiv aber respektvoll – ein echter Teamplayer!' };
  }
  if (speaking === 'rarely' && length === 'long') {
    return { emoji: '🦢', name: 'Schwan', title: 'Bedächtige:r Redner:in', reason: 'Wenige, aber durchdachte Beiträge – Qualität vor Quantität!' };
  }
  if (specialty === 'some') {
    return { emoji: '🦊', name: 'Fuchs', title: 'Cleverer Stratege', reason: 'Du kennst deine Themen und setzt sie geschickt ein!' };
  }
  if (speaking === 'rarely') {
    return { emoji: '🐢', name: 'Schildkröte', title: 'Gründlicher Analyst', reason: 'Du nimmst dir Zeit – wenn du sprichst, ist es durchdacht!' };
  }
  return { emoji: '🐝', name: 'Biene', title: 'Fleißige:r Abgeordnete:r', reason: 'Zuverlässig und engagiert – das Parlament braucht dich!' };
}

export const categories: Category[] = [
  {
    id: 'rede',
    name: 'Rede',
    count: 4226,
    color: '#10b981',
    description: 'Formelle Reden, die vom Präsidium angekündigt und mit einer Anrede an das Präsidium eröffnet werden.',
    examples: [
      'Frau Präsidentin! Meine Damen und Herren!',
      'Sehr geehrter Herr Präsident! Liebe Kolleginnen und Kollegen!',
      'Wertes Präsidium! Sehr geehrte Damen und Herren!',
    ],
    pattern: 'Präsident/in-Anrede + formelle Einleitung',
  },
  {
    id: 'befragung',
    name: 'Regierungsbefragung',
    count: 1135,
    color: '#0ea5e9',
    description: 'Antworten von Regierungsmitgliedern (Minister, Staatssekretäre) während der Befragung der Bundesregierung.',
    examples: [
      'Sehr geehrte Frau Abgeordnete, die Bundesregierung bekennt sich klar...',
      'Vielen Dank für die Frage. Die Maßnahmen wurden bereits...',
      'Der Bundeskanzler hat sich zu diesem Thema bereits geäußert...',
    ],
    pattern: 'Session-Erkennung: "Befragung der Bundesregierung" bis "schließe ich die Befragung"',
  },
  {
    id: 'fragestunde',
    name: 'Fragestunde',
    count: 831,
    color: '#06b6d4',
    description: 'Fragen und Nachfragen während der Fragestunde oder Regierungsbefragung.',
    examples: [
      'Vielen Dank, Frau Präsidentin. - Ich habe eine Nachfrage...',
      'Meine Frage geht an Minister Pistorius...',
      'Welche Konsequenzen zieht die Bundesregierung aus dem Urteil...',
    ],
    pattern: '"Nachfrage", "meine Frage", "Zusatzfrage"',
  },
  {
    id: 'zwischenfrage',
    name: 'Zwischenfrage',
    count: 64,
    color: '#f59e0b',
    description: 'Antworten auf Zwischenfragen anderer Abgeordneter während einer Rede.',
    examples: [
      'Nein. - Was Repräsentation bedeutet...',
      'Frau Kollegin, ich wäre gleich darauf zu sprechen gekommen.',
      'Also, mit Ihrer Frage entlarven Sie das Ganze...',
    ],
    pattern: 'Direkte Antwort oder Kolleg/in-Anrede',
  },
  {
    id: 'fragestunde_antwort',
    name: 'Fragestunde-Antwort',
    count: 48,
    color: '#14b8a6',
    description: 'Antworten der Regierung auf schriftlich eingereichte Fragen in der Fragestunde.',
    examples: [
      'Die Bundesregierung antwortet wie folgt...',
      'Zu Ihrer Frage kann ich mitteilen...',
    ],
    pattern: 'Antwort innerhalb Fragestunde-Session',
  },
  {
    id: 'ortskraefte',
    name: 'Ortskräfte-Erklärung',
    count: 15,
    color: '#ec4899',
    description: 'Koordinierte Fraktionserklärung der SPD zu afghanischen Ortskräften.',
    examples: [
      'Deutschland hat in den vergangenen Jahren bisher gut 20.000 Ortskräfte...',
    ],
    pattern: 'Identischer Text von mehreren SPD-Abgeordneten',
  },
  {
    id: 'abstimmung',
    name: 'Erklärung zur Abstimmung',
    count: 9,
    color: '#8b5cf6',
    description: 'Persönliche Erklärung eines Abgeordneten zu seinem Abstimmungsverhalten.',
    examples: [
      'Ich stimme dem Rentenpaket der Bundesregierung zu...',
      'Die heutige Abstimmung über die Aussetzung des Familiennachzugs...',
      'Ich habe dem Haushaltsgesetz 2026 zugestimmt, weil...',
    ],
    pattern: 'Begründung des Abstimmungsverhaltens',
  },
  {
    id: 'protokoll',
    name: 'Erklärung zu Protokoll',
    count: 6,
    color: '#64748b',
    description: 'Schriftliche Erklärungen, die zu Protokoll gegeben werden.',
    examples: [
      'Heute berät der Bundestag über den Gesetzentwurf zur...',
      'Die Bedrohungslage für Europa ist real und ernst...',
      'Wir benötigen in der aktuellen wirtschaftlichen Lage...',
    ],
    pattern: 'Sachliche Analyse ohne Präsidiums-Anrede',
  },
  {
    id: 'statement',
    name: 'Politische Erklärung',
    count: 5,
    color: '#ef4444',
    description: 'Grundsätzliche politische Positionspapiere und Statements.',
    examples: [
      'Eine echte Migrationswende braucht ein Gesamtkonzept...',
      'Sämtliche Rentenreformpläne der Bundesregierung sind abzulehnen...',
    ],
    pattern: 'Programmatische Aussage ohne formelle Einleitung',
  },
  {
    id: 'sonstiges',
    name: 'Sonstiges',
    count: 1,
    color: '#a1a1aa',
    description: 'Beiträge, die keiner anderen Kategorie zugeordnet werden können.',
    examples: [
      'Nicht klassifizierbare Beiträge...',
    ],
    pattern: 'Fallback-Kategorie',
  },
];

export const spiritAnimalDistribution = [
  { emoji: '🐿️', name: 'Eichhörnchen', count: 153, pct: '33%' },
  { emoji: '🐝', name: 'Biene', count: 75, pct: '16%' },
  { emoji: '🦫', name: 'Biber', count: 55, pct: '12%' },
  { emoji: '🐰', name: 'Hase', count: 44, pct: '10%' },
  { emoji: '🦦', name: 'Otter', count: 36, pct: '8%' },
  { emoji: '🦊', name: 'Fuchs', count: 21, pct: '5%' },
  { emoji: '🐺', name: 'Wolf', count: 15, pct: '3%' },
  { emoji: '🦔', name: 'Igel', count: 14, pct: '3%' },
];

export const slidesOverview = [
  { num: 1, name: 'Intro', desc: 'Name, Partei, Branding' },
  { num: 2, name: 'Spirit Animal', desc: 'Bundestag-Tier basierend auf Redeverhalten' },
  { num: 3, name: 'Quiz', desc: 'Signature Word erraten' },
  { num: 4, name: 'Statistiken', desc: 'Reden, Wörter, Rankings im Vergleich' },
  { num: 5, name: 'Top-Wörter', desc: 'Meistgenutzte Wörter der:des Abgeordneten' },
  { num: 6, name: 'Teilen', desc: 'Shareable Image mit Spirit Animal' },
];

export const sentimentKeywordsPositive = [
  'genau', 'richtig', 'bravo', 'stimmt', 'jawohl', 'korrekt', 'natürlich', 'gut so', 'gute rede'
];

export const sentimentKeywordsNegative = [
  'unsinn', 'quatsch', 'falsch', 'lüge', 'skandal', 'hört! hört!', 'aha!', 'schande'
];

export const limitations = [
  'Der Algorithmus setzt konsistente Formatierung der Plenarprotokolle voraus.',
  'Ungewöhnliche Formulierungen können vom Musterabgleich nicht erfasst werden.',
  'Eine 100%ige Unterscheidung zwischen gesprochenen und schriftlichen Beiträgen ist nicht möglich.',
  'Historische Protokolle (vor WP21) können abweichende Formatierungen aufweisen.',
  'Die Geschlechtserkennung basiert auf Vornamen und unterstützt nur binäres Geschlecht (männlich/weiblich/unbekannt).',
  'Internationale Namen benötigen manuelle Zuordnung in den BUNDESTAG_OVERRIDES.',
  'Die Geschlechtszuordnung basiert auf Namensheuristiken, nicht auf Selbstidentifikation.',
  'Fraktionslose Abgeordnete erscheinen nicht in Partei-Rankings, haben aber eigene Speaker Wrappeds.',
];

export const statsData = [
  { label: 'Beiträge analysiert', value: '6.340' },
  { label: 'Kategorien', value: '10' },
  { label: 'Klassifikationsrate', value: '100%' },
  { label: 'Protokolle', value: '50' },
];
