/**
 * Notebook API core. Search runs through the same functions the MCP tools use
 * (`searchProtocolChunks` / `searchDocumentChunks` + their filter builders) —
 * no second Qdrant query path. This module only maps the wire filters onto
 * those builders and the results onto the wire schema.
 */

import { config } from '../config.js';
import { getClient } from '../services/qdrant/client.js';
import {
  buildProtocolFilter,
  searchProtocolChunks
} from '../services/qdrant/protocolCollection.js';
import {
  buildDocumentFilter,
  searchDocumentChunks
} from '../services/qdrant/documentCollection.js';
import { bestExcerpt, documentChunk, longFactions, shortFactions, speechChunk } from './mapping.js';
import { parseSpeechDocId, protocolLayout } from './units.js';

const SPEECHES = 'speeches';
const DOCUMENTS = 'documents';

/**
 * Wire filters → per-source Qdrant filters. A source the filters cannot match
 * (e.g. `speaker` for Drucksachen) is left out; `null` means "ask nothing".
 */
export function planSources(sources, f = {}) {
  let wanted = new Set(sources && sources.length ? sources : [SPEECHES, DOCUMENTS]);
  if (f.speaker?.length) wanted.delete(DOCUMENTS);
  if (f.drucksachetyp?.length || f.urheber?.length) wanted.delete(SPEECHES);

  const plan = {};
  if (wanted.has(SPEECHES)) {
    plan[SPEECHES] = buildProtocolFilter({
      speakerParties: f.party,
      speakers: f.speaker,
      wahlperioden: f.wahlperiode,
      speechTypes: f.section_type,
      dateFrom: f.from,
      dateTo: f.to
    });
  }
  if (wanted.has(DOCUMENTS)) {
    const partyLong = f.party?.length ? longFactions(f.party) : null;
    if (!partyLong || partyLong.length > 0) {
      const filter = buildDocumentFilter({
        drucksachetypen: f.drucksachetyp,
        urheberAny: f.urheber,
        wahlperioden: f.wahlperiode,
        chunkTypes: f.section_type,
        dateFrom: f.from,
        dateTo: f.to
      });
      const must = [...(filter?.must || [])];
      // Party and urheber both set means both: two conditions, not one list.
      if (partyLong) must.push({ key: 'urheber', match: { any: partyLong } });
      plan[DOCUMENTS] = must.length ? { must } : null;
    }
  }
  return plan;
}

function withCondition(filter, condition) {
  return { must: [...(filter?.must || []), condition] };
}

async function speechChunks(points) {
  const out = [];
  for (const point of points) {
    const layout = await protocolLayout(point.payload.protokoll_id);
    out.push({ point, chunk: speechChunk(point, layout.speechOf.get(point.id) ?? point.payload.chunk_index) });
  }
  return out;
}

export async function search({ vector, query, sources, filters, limit, scoreThreshold }) {
  const plan = planSources(sources, filters);
  const options = (filter) => ({ limit, filter, scoreThreshold: scoreThreshold ?? 0 });
  const [speeches, documents] = await Promise.all([
    SPEECHES in plan ? searchProtocolChunks(vector, options(plan[SPEECHES])) : [],
    DOCUMENTS in plan ? searchDocumentChunks(vector, options(plan[DOCUMENTS])) : []
  ]);
  const hits = [
    ...(await speechChunks(speeches)),
    ...documents.map((point) => ({ point, chunk: documentChunk(point) }))
  ];
  return hits
    .sort((a, b) => b.point.score - a.point.score)
    .slice(0, limit)
    .map(({ point, chunk }) => ({
      ...chunk,
      score: point.score,
      excerpt: bestExcerpt(chunk.text, query)
    }));
}

export async function chunks({ source, doc_id, chunk_indexes }) {
  const qdrant = getClient();
  if (!qdrant) throw new Error('Qdrant not available');
  const wanted = new Set(chunk_indexes);

  if (source === SPEECHES) {
    const ref = parseSpeechDocId(doc_id);
    if (!ref) return [];
    const layout = await protocolLayout(ref.protokollId);
    const ids = (layout.parts.get(ref.speechStart) || [])
      .filter((p) => wanted.has(p.part))
      .map((p) => p.id);
    if (ids.length === 0) return [];
    const points = await qdrant.retrieve(config.qdrant.protocolCollection, {
      ids,
      with_payload: true,
      with_vector: false
    });
    return points
      .map((point) => speechChunk(point, ref.speechStart))
      .sort((a, b) => a.chunk_index - b.chunk_index);
  }

  const drucksacheId = Number(doc_id);
  if (!Number.isInteger(drucksacheId)) return [];
  const page = await qdrant.scroll(config.qdrant.documentCollection, {
    filter: {
      must: [
        { key: 'drucksache_id', match: { value: drucksacheId } },
        { key: 'chunk_index', match: { any: [...wanted] } }
      ]
    },
    with_payload: true,
    with_vector: false,
    limit: wanted.size
  });
  return page.points.map(documentChunk).sort((a, b) => a.chunk_index - b.chunk_index);
}

/** Per wire field: which payload field each source facets, and over which points. */
const FACETS = {
  party: { speeches: 'speaker_party', documents: 'urheber' },
  wahlperiode: { speeches: 'wahlperiode', documents: 'wahlperiode' },
  speaker: { speeches: 'speaker' },
  drucksachetyp: { documents: 'drucksachetyp' },
  urheber: { documents: 'urheber' },
  section_type: { speeches: 'speech_type', documents: 'chunk_type' }
};

/**
 * Counted per unit (speech head `chunk_part = 0`, document head
 * `chunk_index = 0`) — except `section_type` on Drucksachen, which varies per
 * chunk and is counted per chunk.
 */
function headFilter(source, field, filter) {
  if (source === SPEECHES) return withCondition(filter, { key: 'chunk_part', match: { value: 0 } });
  if (field === 'section_type') return filter;
  return withCondition(filter, { key: 'chunk_index', match: { value: 0 } });
}

const COLLECTION = {
  speeches: () => config.qdrant.protocolCollection,
  documents: () => config.qdrant.documentCollection
};

export async function facets({ field, sources, filters, limit }) {
  const qdrant = getClient();
  if (!qdrant) throw new Error('Qdrant not available');
  const plan = planSources(sources, filters);

  if (field === 'source') {
    const counts = await Promise.all(
      Object.entries(plan).map(async ([source, filter]) => {
        const { count } = await qdrant.count(COLLECTION[source](), {
          filter: headFilter(source, field, filter),
          exact: true
        });
        return { value: source, count };
      })
    );
    return counts.filter((c) => c.count > 0);
  }

  const merged = new Map();
  await Promise.all(
    Object.entries(plan).map(async ([source, filter]) => {
      const key = FACETS[field]?.[source];
      if (!key) return;
      const { hits } = await qdrant.facet(COLLECTION[source](), {
        key,
        filter: headFilter(source, field, filter),
        limit,
        exact: true
      });
      for (const { value, count } of hits) {
        const values = field === 'party' && source === DOCUMENTS ? shortFactions(value) : [value];
        for (const v of values) merged.set(v, (merged.get(v) || 0) + count);
      }
    })
  );
  return [...merged.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export const FACET_FIELDS = ['source', ...Object.keys(FACETS)];
