import type { Edition } from './registry';

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Berlin',
});

export function previewCoverageLabel(manifest: Edition | undefined): string | null {
  if (!manifest || manifest.status !== 'preview') return null;
  // Noon UTC stays on the same calendar day throughout Europe/Berlin, including
  // editions whose cutoff falls outside daylight-saving time.
  const date = new Date(`${manifest.coverage.lastProtocolDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'Vorschau';
  return `Vorschau · Daten bis ${dateFormatter.format(date)}`;
}
