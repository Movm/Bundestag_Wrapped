/**
 * The citable unit of the notebook API: a speech (from a Plenarprotokoll) or a
 * Drucksache. `doc_id` names the unit and `chunk_index` counts within it.
 *
 * Speeches have no stored id. Their layout is derived per protocol from
 * `chunk_index`/`chunk_part`, which the two indexing paths write differently:
 * - Python parser: every chunk gets its own `chunk_index`, `chunk_part`
 *   counts the parts of a split speech → the speech starts at
 *   `chunk_index - chunk_part`.
 * - JS fallback parser: the parts of a split speech share `chunk_index`.
 * A protocol with a duplicate `chunk_index` came from the JS path. In both,
 * `chunk_part` is the position within the speech. Deriving it at read time
 * needs no migration of the indexed data.
 */

import { getClient } from '../services/qdrant/client.js';
import { config } from '../config.js';

const LAYOUT_TTL_MS = 60 * 60 * 1000;
const LAYOUT_CACHE_MAX = 500;
/** @type {Map<number, {expires: number, speechOf: Map<string|number, number>, parts: Map<number, Array<{id: string|number, part: number}>>}>} */
const layouts = new Map();

/** Group protocol points into speeches. Exported for tests. */
export function layoutFromPoints(points) {
  const indexCounts = new Map();
  for (const p of points) {
    const ci = p.payload.chunk_index;
    indexCounts.set(ci, (indexCounts.get(ci) || 0) + 1);
  }
  const sharedIndexes = [...indexCounts.values()].some((n) => n > 1);
  const speechOf = new Map();
  const parts = new Map();
  for (const p of points) {
    const part = p.payload.chunk_part || 0;
    const start = sharedIndexes ? p.payload.chunk_index : p.payload.chunk_index - part;
    speechOf.set(p.id, start);
    if (!parts.has(start)) parts.set(start, []);
    parts.get(start).push({ id: p.id, part });
  }
  for (const list of parts.values()) list.sort((a, b) => a.part - b.part);
  return { speechOf, parts };
}

export async function protocolLayout(protokollId) {
  const cached = layouts.get(protokollId);
  if (cached && cached.expires > Date.now()) return cached;

  const qdrant = getClient();
  if (!qdrant) throw new Error('Qdrant not available');
  const points = [];
  let offset = null;
  do {
    const page = await qdrant.scroll(config.qdrant.protocolCollection, {
      filter: { must: [{ key: 'protokoll_id', match: { value: protokollId } }] },
      with_payload: ['chunk_index', 'chunk_part'],
      with_vector: false,
      limit: 1000,
      ...(offset !== null && { offset })
    });
    points.push(...page.points);
    offset = page.next_page_offset ?? null;
  } while (offset !== null);

  const layout = { ...layoutFromPoints(points), expires: Date.now() + LAYOUT_TTL_MS };
  if (layouts.size >= LAYOUT_CACHE_MAX) layouts.delete(layouts.keys().next().value);
  layouts.set(protokollId, layout);
  return layout;
}

export function speechDocId(protokollId, speechStart) {
  return `${protokollId}-${speechStart}`;
}

export function parseSpeechDocId(docId) {
  const m = /^(\d+)-(\d+)$/.exec(docId);
  return m ? { protokollId: Number(m[1]), speechStart: Number(m[2]) } : null;
}

export function clearLayoutCacheForTests() {
  layouts.clear();
}
