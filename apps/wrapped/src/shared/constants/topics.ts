/**
 * Topic category metadata for Scheme F topic analysis.
 * Used across the web app.
 */

export interface TopicMeta {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const TOPICS: TopicMeta[] = [
  { id: 'migration', name: 'Migration', emoji: '🌍', color: '#f59e0b' },
  { id: 'klima', name: 'Klima & Umwelt', emoji: '🌱', color: '#22c55e' },
  { id: 'wirtschaft', name: 'Wirtschaft', emoji: '📈', color: '#3b82f6' },
  { id: 'soziales', name: 'Soziales', emoji: '🤝', color: '#ec4899' },
  { id: 'sicherheit', name: 'Sicherheit', emoji: '🛡️', color: '#6366f1' },
  { id: 'gesundheit', name: 'Gesundheit', emoji: '🏥', color: '#14b8a6' },
  { id: 'europa', name: 'Europa/Außen', emoji: '🇪🇺', color: '#8b5cf6' },
  { id: 'digital', name: 'Digitales & Medien', emoji: '💻', color: '#06b6d4' },
  { id: 'bildung', name: 'Bildung', emoji: '🎓', color: '#f97316' },
  { id: 'finanzen', name: 'Finanzen', emoji: '💰', color: '#eab308' },
  { id: 'justiz', name: 'Justiz/Recht', emoji: '⚖️', color: '#78716c' },
  { id: 'arbeit', name: 'Arbeit', emoji: '👷', color: '#84cc16' },
  { id: 'mobilitaet', name: 'Mobilität', emoji: '🚆', color: '#0ea5e9' },
];

export const TOPIC_BY_ID = Object.fromEntries(
  TOPICS.map(t => [t.id, t])
) as Record<string, TopicMeta>;
