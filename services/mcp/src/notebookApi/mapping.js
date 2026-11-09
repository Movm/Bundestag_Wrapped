/**
 * Payload → wire schema v1. This is the only place that knows both the
 * collection payload names and the API names; renaming a payload field means
 * changing it here, never in a client.
 */

/** Long DIP names → the short names the speeches collection stores. */
const SHORT_FACTION = {
  'BÜNDNIS 90/DIE GRÜNEN': 'GRÜNE',
  'CDU/CSU': 'CDU/CSU',
  SPD: 'SPD',
  AfD: 'AfD',
  'DIE LINKE': 'DIE LINKE',
  FDP: 'FDP',
  BSW: 'BSW',
  SSW: 'SSW',
  fraktionslos: 'fraktionslos'
};

export function shortFactions(urheber) {
  const list = Array.isArray(urheber) ? urheber : urheber ? [urheber] : [];
  return [...new Set(list.map((u) => SHORT_FACTION[u]).filter(Boolean))];
}

/** Short party names → the long names Drucksachen carry in `urheber`. */
export function longFactions(parties) {
  return Object.entries(SHORT_FACTION)
    .filter(([, short]) => parties.includes(short))
    .map(([long]) => long);
}

/** `21/105` → https://dserver.bundestag.de/btp/21/21105.pdf */
export function protocolPdfUrl(dokumentnummer) {
  const m = /^(\d+)\/(\d+)$/.exec(dokumentnummer || '');
  return m ? `https://dserver.bundestag.de/btp/${m[1]}/${m[1]}${m[2].padStart(3, '0')}.pdf` : null;
}

/** `21/1234` → https://dserver.bundestag.de/btd/21/012/2101234.pdf */
export function drucksachePdfUrl(dokumentnummer) {
  const m = /^(\d+)\/(\d+)$/.exec(dokumentnummer || '');
  if (!m) return null;
  const num = m[2].padStart(5, '0');
  return `https://dserver.bundestag.de/btd/${m[1]}/${num.slice(0, 3)}/${m[1]}${num}.pdf`;
}

const EXCERPT_MAX = 1800;

/**
 * The ≤1800-character window of `text` that covers most query terms, cut at
 * sentence boundaries. `null` when the text already fits — the caller then
 * takes `text` as is.
 */
export function bestExcerpt(text, query) {
  if (!text || text.length <= EXCERPT_MAX) return null;
  const terms = [...new Set((query || '').toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || [])];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let best = { score: -1, start: 0, end: 0 };
  for (let i = 0; i < sentences.length; i++) {
    let length = 0;
    let j = i;
    while (j < sentences.length && length + sentences[j].length + 1 <= EXCERPT_MAX) {
      length += sentences[j].length + 1;
      j++;
    }
    if (j === i) continue;
    const window = sentences.slice(i, j).join(' ').toLowerCase();
    const score = terms.filter((t) => window.includes(t)).length;
    if (score > best.score) best = { score, start: i, end: j };
  }
  if (best.score < 0) return text.slice(0, EXCERPT_MAX);
  return sentences.slice(best.start, best.end).join(' ');
}

function isoDate(datum) {
  return typeof datum === 'string' ? datum.slice(0, 10) : null;
}

/**
 * @param {object} point - Qdrant point of the protocol collection
 * @param {number} speechStart - from the protocol layout
 */
export function speechChunk(point, speechStart) {
  const p = point.payload;
  const party = p.speaker_party ? [p.speaker_party] : [];
  const date = isoDate(p.datum);
  return {
    id: String(point.id),
    source: 'speeches',
    doc_id: `${p.protokoll_id}-${speechStart}`,
    chunk_index: p.chunk_part || 0,
    title: `Rede von ${p.speaker || 'unbekannt'}${party[0] ? ` (${party[0]})` : ''} – Plenarprotokoll ${p.dokumentnummer}${date ? `, ${date}` : ''}`,
    url: protocolPdfUrl(p.dokumentnummer),
    date,
    wahlperiode: p.wahlperiode ?? null,
    dokumentnummer: p.dokumentnummer ?? null,
    speaker: p.speaker ?? null,
    party,
    drucksachetyp: null,
    urheber: [],
    section_type: p.speech_type ?? null,
    text: p.text || ''
  };
}

export function documentChunk(point) {
  const p = point.payload;
  const urheber = Array.isArray(p.urheber) ? p.urheber : p.urheber ? [p.urheber] : [];
  return {
    id: String(point.id),
    source: 'documents',
    doc_id: String(p.drucksache_id),
    chunk_index: p.chunk_index ?? 0,
    title: p.titel || `Drucksache ${p.dokumentnummer}`,
    url: drucksachePdfUrl(p.dokumentnummer),
    date: isoDate(p.datum),
    wahlperiode: p.wahlperiode ?? null,
    dokumentnummer: p.dokumentnummer ?? null,
    speaker: null,
    party: shortFactions(urheber),
    drucksachetyp: p.drucksachetyp ?? null,
    urheber,
    section_type: p.chunk_type ?? null,
    text: p.text || ''
  };
}
