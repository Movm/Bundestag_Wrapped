import { readFileSync } from 'node:fs';

export const PUBLICATION_NOT_BEFORE = { '2026': '2026-12-01' };

function berlinDate(instant) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function assertPublicRegistryAllowed(registry, now = new Date()) {
  const today = berlinDate(now);
  for (const edition of registry.editions ?? []) {
    const notBefore = PUBLICATION_NOT_BEFORE[edition.id];
    if (notBefore && today < notBefore) {
      throw new Error(`${edition.id} must not be registered for public delivery before ${notBefore} Europe/Berlin`);
    }
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const registry = JSON.parse(readFileSync('apps/wrapped/public/data/editions.json', 'utf8'));
  assertPublicRegistryAllowed(registry, process.env.PUBLICATION_NOW ? new Date(process.env.PUBLICATION_NOW) : new Date());
  console.log('Public edition publication gate passed.');
}
