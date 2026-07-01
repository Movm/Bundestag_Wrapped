/**
 * Aggregation & lifecycle-digest tools for the Bundestag MCP.
 *
 * These add no new data source — they compose the existing DIP search endpoints
 * into two capabilities the raw search tools don't offer:
 *   - bundestag_count: counts / time-series / group-by via the numFound the DIP
 *     API already returns, without paging every matching row into context.
 *   - bundestag_vorgang_timeline: a compact lifecycle digest of one Vorgang
 *     (decisions, committee referrals, speakers, documents) that is otherwise
 *     scattered across the raw Vorgangsposition records.
 */

import { z } from 'zod';
import * as api from '../api/bundestag.js';

// ============================================================================
// bundestag_count — counts, time-series, and group-by
// ============================================================================

// Entities whose search endpoint reports a numFound total we can count on.
const ENTITY_SEARCH = {
  drucksache: api.searchDrucksachen,
  vorgang: api.searchVorgaenge,
  plenarprotokoll: api.searchPlenarprotokolle,
  aktivitaet: api.searchAktivitaeten,
  person: api.searchPersonen
};

// Group-by fields that map to an actual DIP filter, and which entity they apply to.
// Each value is applied as that filter and counted independently.
const GROUP_FIELDS = {
  drucksachetyp: {
    entity: 'drucksache',
    defaults: [
      'Gesetzentwurf', 'Antrag', 'Kleine Anfrage', 'Große Anfrage',
      'Beschlussempfehlung und Bericht', 'Unterrichtung', 'Entschließungsantrag',
      'Änderungsantrag', 'Bericht', 'Schriftliche Frage'
    ]
  },
  vorgangstyp: {
    entity: 'vorgang',
    defaults: [
      'Gesetzgebung', 'Antrag', 'Kleine Anfrage', 'Große Anfrage',
      'Unterrichtung', 'Beschlussempfehlung und Bericht'
    ]
  },
  initiative: {
    entity: 'vorgang',
    // Open-ended (any faction/author string); caller must supply groupValues.
    defaults: null
  }
};

const MAX_BUCKETS = 240;

// Count is just the numFound from a single-row search — no rows paged into context.
async function countFor(entity, params, useCache) {
  const fn = ENTITY_SEARCH[entity];
  const result = await fn({ ...params, limit: 1 }, { useCache });
  return result.numFound || 0;
}

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Inclusive month buckets between two YYYY-MM-DD dates.
export function monthBuckets(start, end) {
  const buckets = [];
  let year = Number(start.slice(0, 4));
  let month = Number(start.slice(5, 7));
  const endYear = Number(end.slice(0, 4));
  const endMonth = Number(end.slice(5, 7));

  while ((year < endYear || (year === endYear && month <= endMonth)) && buckets.length < MAX_BUCKETS) {
    const mm = String(month).padStart(2, '0');
    const last = String(lastDayOfMonth(year, month)).padStart(2, '0');
    buckets.push({ label: `${year}-${mm}`, start: `${year}-${mm}-01`, end: `${year}-${mm}-${last}` });
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return buckets;
}

// Inclusive year buckets between two YYYY-MM-DD dates.
export function yearBuckets(start, end) {
  const buckets = [];
  const endYear = Number(end.slice(0, 4));
  for (let year = Number(start.slice(0, 4)); year <= endYear && buckets.length < MAX_BUCKETS; year += 1) {
    buckets.push({ label: String(year), start: `${year}-01-01`, end: `${year}-12-31` });
  }
  return buckets;
}

export const countTool = {
  name: 'bundestag_count',
  description: `Count matching records (and optionally group them) WITHOUT paging every row into context.
Uses the DIP API's total-match count, so it is cheap even for large result sets.

Use this for questions like:
- "How many Kleine Anfragen did the opposition file in Wahlperiode 21?" (entity: drucksache, drucksachetyp, wahlperiode)
- "Trend of Gesetzgebung proceedings per month in 2026" (entity: vorgang, vorgangstyp, groupBy: month, date range)
- "Breakdown of documents by type this period" (entity: drucksache, groupBy: drucksachetyp)

groupBy:
- "none" (default): single total.
- "month" / "year": a time series — REQUIRES datum_start and datum_end (max 240 buckets).
- "drucksachetyp" (entity drucksache) / "vorgangstyp" (entity vorgang): one count per type.
- "initiative" (entity vorgang): one count per faction/author — REQUIRES groupValues.`,

  inputSchema: {
    entity: z.enum(['drucksache', 'vorgang', 'plenarprotokoll', 'aktivitaet', 'person'])
      .describe('Which record type to count'),
    query: z.string().optional()
      .describe('Optional title/name search text to constrain the count'),
    wahlperiode: z.number().int().min(1).max(30).optional()
      .describe('Electoral period (Wahlperiode), e.g., 21 for current'),
    datum_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
      .describe('Start date (YYYY-MM-DD). Required for groupBy month/year.'),
    datum_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
      .describe('End date (YYYY-MM-DD). Required for groupBy month/year.'),
    drucksachetyp: z.string().optional()
      .describe('Filter: document type (entity drucksache), e.g., "Kleine Anfrage"'),
    vorgangstyp: z.string().optional()
      .describe('Filter: proceeding type (entity vorgang), e.g., "Gesetzgebung"'),
    initiative: z.string().optional()
      .describe('Filter: initiating faction/author (entity vorgang), e.g., "BÜNDNIS 90/DIE GRÜNEN"'),
    aktivitaetsart: z.string().optional()
      .describe('Filter: activity type (entity aktivitaet), e.g., "Rede"'),
    groupBy: z.enum(['none', 'month', 'year', 'drucksachetyp', 'vorgangstyp', 'initiative']).default('none')
      .describe('Dimension to break the count down by (see description)'),
    groupValues: z.array(z.string()).optional()
      .describe('Explicit values to group over (overrides defaults; required for groupBy initiative)'),
    useCache: z.boolean().default(true)
      .describe('Whether to use cached results')
  },

  async handler(params) {
    try {
      const { entity, groupBy = 'none', useCache = true } = params;

      // Base filters passed through to the search endpoint on every count.
      const base = {};
      if (params.query) base.query = params.query;
      if (params.wahlperiode) base.wahlperiode = params.wahlperiode;
      if (params.datum_start) base.datum_start = params.datum_start;
      if (params.datum_end) base.datum_end = params.datum_end;
      if (params.drucksachetyp) base.drucksachetyp = params.drucksachetyp;
      if (params.vorgangstyp) base.vorgangstyp = params.vorgangstyp;
      if (params.initiative) base.initiative = params.initiative;
      if (params.aktivitaetsart) base.aktivitaetsart = params.aktivitaetsart;

      // --- Ungrouped: single total -----------------------------------------
      if (groupBy === 'none') {
        const total = await countFor(entity, base, useCache);
        return { success: true, endpoint: 'count', entity, groupBy, filters: base, total };
      }

      // --- Time series ------------------------------------------------------
      if (groupBy === 'month' || groupBy === 'year') {
        if (!params.datum_start || !params.datum_end) {
          return {
            error: true,
            endpoint: 'count',
            message: `groupBy "${groupBy}" requires both datum_start and datum_end`
          };
        }
        const buckets = groupBy === 'month'
          ? monthBuckets(params.datum_start, params.datum_end)
          : yearBuckets(params.datum_start, params.datum_end);

        // Each bucket overrides the date window; other base filters still apply.
        const groups = [];
        for (const bucket of buckets) {
          const count = await countFor(
            entity,
            { ...base, datum_start: bucket.start, datum_end: bucket.end },
            useCache
          );
          groups.push({ label: bucket.label, count });
        }
        const total = groups.reduce((sum, g) => sum + g.count, 0);
        return { success: true, endpoint: 'count', entity, groupBy, filters: base, total, groups };
      }

      // --- Group by a filter field -----------------------------------------
      const field = GROUP_FIELDS[groupBy];
      if (field.entity !== entity) {
        return {
          error: true,
          endpoint: 'count',
          message: `groupBy "${groupBy}" only applies to entity "${field.entity}", not "${entity}"`
        };
      }
      const values = params.groupValues && params.groupValues.length > 0
        ? params.groupValues
        : field.defaults;
      if (!values) {
        return {
          error: true,
          endpoint: 'count',
          message: `groupBy "${groupBy}" is open-ended — provide groupValues (e.g., faction names)`
        };
      }

      const groups = [];
      for (const value of values) {
        // The group field replaces any same-named base filter.
        const count = await countFor(entity, { ...base, [groupBy]: value }, useCache);
        groups.push({ label: value, count });
      }
      groups.sort((a, b) => b.count - a.count);
      const total = groups.reduce((sum, g) => sum + g.count, 0);
      return { success: true, endpoint: 'count', entity, groupBy, filters: base, total, groups };
    } catch (err) {
      return { error: true, endpoint: 'count', message: err.message };
    }
  }
};

// ============================================================================
// bundestag_vorgang_timeline — one proceeding's lifecycle, digested
// ============================================================================

function pdfFromFundstelle(f) {
  if (!f) return null;
  return f.pdf_url || null;
}

// Collapse the raw Vorgangsposition list into a compact, chronological digest.
export function buildDigest(vorgang, positions) {
  const steps = [];
  const decisions = [];
  const speakers = [];
  const documents = [];
  const committeeMap = new Map();

  for (const pos of positions) {
    const datum = pos.datum || null;
    const chamber = pos.zuordnung || null; // BT | BR
    const fundstelle = pos.fundstelle || null;

    steps.push({
      datum,
      position: pos.vorgangsposition || null,
      chamber,
      dokumentart: fundstelle?.dokumentart || pos.dokumentart || null,
      dokumentnummer: fundstelle?.dokumentnummer || null
    });

    // Documents referenced by this step.
    if (fundstelle?.dokumentnummer) {
      documents.push({
        dokumentnummer: fundstelle.dokumentnummer,
        dokumentart: fundstelle.dokumentart || null,
        drucksachetyp: fundstelle.drucksachetyp || null,
        datum: fundstelle.datum || null,
        pdf_url: pdfFromFundstelle(fundstelle)
      });
    }

    // Committee referrals (federführend vs. mitberatend).
    for (const u of pos.ueberweisung || []) {
      const key = u.ausschuss_kuerzel || u.ausschuss;
      if (!key) continue;
      const existing = committeeMap.get(key);
      // Keep the strongest signal: once federführend, stays federführend.
      if (!existing || (u.federfuehrung && !existing.federfuehrend)) {
        committeeMap.set(key, {
          ausschuss: u.ausschuss || null,
          kuerzel: u.ausschuss_kuerzel || null,
          federfuehrend: !!u.federfuehrung
        });
      }
    }

    // Collective decisions (Beschlusstenor) — the outcome, not the roll-call.
    for (const b of pos.beschlussfassung || []) {
      decisions.push({
        datum,
        position: pos.vorgangsposition || null,
        chamber,
        tenor: b.beschlusstenor || null,
        grundlage: b.grundlage || null,
        dokumentnummer: b.dokumentnummer || null,
        seite: b.seite || null
      });
    }

    // Speakers in a debate step (name, party, page anchor).
    for (const a of pos.aktivitaet_anzeige || []) {
      speakers.push({
        datum,
        aktivitaetsart: a.aktivitaetsart || null,
        titel: a.titel || null,
        seite: a.seite || null,
        pdf_url: a.pdf_url || null
      });
    }
  }

  const byDate = (a, b) => String(a.datum || '').localeCompare(String(b.datum || ''));
  steps.sort(byDate);
  decisions.sort(byDate);
  speakers.sort(byDate);

  // Dedupe documents by number, keeping first occurrence.
  const seenDocs = new Set();
  const uniqueDocs = [];
  for (const d of documents) {
    if (seenDocs.has(d.dokumentnummer)) continue;
    seenDocs.add(d.dokumentnummer);
    uniqueDocs.push(d);
  }

  return {
    vorgang: {
      id: vorgang.id,
      titel: vorgang.titel || null,
      vorgangstyp: vorgang.vorgangstyp || null,
      beratungsstand: vorgang.beratungsstand || null,
      sachgebiet: vorgang.sachgebiet || null,
      initiative: vorgang.initiative || null,
      zustimmungsbeduerftigkeit: vorgang.zustimmungsbeduerftigkeit || null
    },
    counts: {
      steps: steps.length,
      decisions: decisions.length,
      committees: committeeMap.size,
      speakers: speakers.length,
      documents: uniqueDocs.length
    },
    committees: Array.from(committeeMap.values()),
    steps,
    decisions,
    speakers,
    documents: uniqueDocs
  };
}

export const vorgangTimelineTool = {
  name: 'bundestag_vorgang_timeline',
  description: `Digest one Vorgang (legislative proceeding) into a compact lifecycle view.
Fetches the proceeding and all its Vorgangspositionen and returns, in chronological order:
- steps: each stage (1. Beratung, committee referral, Durchgang, …) with chamber (BT/BR) and document
- committees: which Ausschüsse it was referred to (federführend vs. mitberatend)
- decisions: collective Beschlusstenor per stage (e.g. "Überweisung", "Annahme") — the OUTCOME.
  NOTE: the DIP data does NOT contain per-MP roll-call votes; only the collective tenor.
- speakers: who spoke in each debate (name, party, PDF page anchor)
- documents: all referenced Drucksachen/protocols with PDF links

Get a Vorgang ID first via bundestag_search_vorgaenge or bundestag_semantic_search.`,

  inputSchema: {
    vorgang_id: z.number().int().positive()
      .describe('Vorgang ID to digest'),
    useCache: z.boolean().default(true)
      .describe('Whether to use cached results')
  },

  async handler(params) {
    try {
      const vorgang = await api.getVorgang(params.vorgang_id, { useCache: params.useCache });
      if (!vorgang) {
        return {
          error: true,
          endpoint: 'vorgang_timeline',
          message: `Vorgang with ID ${params.vorgang_id} not found`
        };
      }

      // Up to 100 positions — enough for virtually every proceeding.
      const posResult = await api.searchVorgangspositionen(
        { vorgang_id: params.vorgang_id, limit: 100 },
        { useCache: params.useCache }
      );
      const positions = posResult.documents || [];

      const digest = buildDigest(vorgang, positions);
      return {
        success: true,
        endpoint: 'vorgang_timeline',
        cached: vorgang.cached,
        hasMorePositions: !!posResult.cursor,
        ...digest
      };
    } catch (err) {
      return {
        error: true,
        endpoint: 'vorgang_timeline',
        message: err.message,
        vorgang_id: params.vorgang_id
      };
    }
  }
};

export const aggregateTools = [countTool, vorgangTimelineTool];
