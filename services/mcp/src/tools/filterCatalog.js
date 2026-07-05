/**
 * Filter Catalog Tool for Bundestag MCP Server
 *
 * A read-only discovery tool: it tells the model which filter fields each search
 * surface accepts and what values they take, so the model can pick valid filter
 * values instead of guessing. The catalog is a static constant derived from the
 * value-producing code:
 *  - closed enums live in the tool inputSchemas (search.js, semanticSearch.js),
 *  - party short-names come from the Python parser's Open-Discourse normalization
 *    (services/analysis/src/noun_analysis/factions.py → FACTION_PATTERNS keys),
 *  - party long-names come from the DIP `fraktion` field / factions resource,
 *  - Bundesländer from protokollParser.js.
 * Keep this in sync when those value sets change.
 */

import { z } from 'zod';

// Party names as stored in the speeches/protocol collection. The Python enhanced
// parser normalizes affiliations to these SHORT keys (Open Discourse patterns),
// so `speakerParty` in bundestag_search_speeches must match one of these.
const SPEECH_PARTY_SHORT = [
  'CDU/CSU', 'SPD', 'GRÜNE', 'FDP', 'AfD', 'DIE LINKE', 'BSW', 'fraktionslos', 'SSW'
];
// Historical parties that also appear in older protocols (WP <15).
const SPEECH_PARTY_HISTORICAL = ['PDS', 'GB/BHE', 'DP', 'KPD', 'FVP'];

// Party names as used by the DIP API `fraktion` field and by semantic_search's
// `fraktion`/`initiative` filters — the LONG official names.
const DIP_PARTY_LONG = [
  'CDU/CSU', 'SPD', 'BÜNDNIS 90/DIE GRÜNEN', 'AfD', 'DIE LINKE', 'FDP', 'BSW', 'fraktionslos'
];

// The one gotcha that trips up cross-layer filtering.
const PARTY_NAMING_NOTE =
  'Party naming differs by layer: the speeches/protocol collection stores SHORT names ' +
  '(e.g. "GRÜNE"), while the DIP tools and semantic_search fraktion/initiative use the ' +
  'LONG official names (e.g. "BÜNDNIS 90/DIE GRÜNEN"). CDU/CSU, SPD, AfD, DIE LINKE and ' +
  'fraktionslos are identical in both layers; only GRÜNE ↔ BÜNDNIS 90/DIE GRÜNEN differ. ' +
  'FDP and BSW are not in the 21st Bundestag (present in earlier periods).';

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
];

const DRUCKSACHETYPEN = [
  'Gesetzentwurf', 'Antrag', 'Kleine Anfrage', 'Große Anfrage',
  'Beschlussempfehlung und Bericht', 'Unterrichtung', 'Entschließungsantrag',
  'Änderungsantrag', 'Bericht', 'Schriftliche Frage'
];

const SEMANTIC_ENTITY_TYPES = [
  'Gesetzentwurf', 'Antrag', 'Kleine Anfrage', 'Große Anfrage',
  'Beschlussempfehlung und Bericht', 'Unterrichtung', 'Entschließungsantrag',
  'Änderungsantrag', 'Bericht', 'Schriftliche Frage',
  'Gesetzgebung', 'Selbständiger Antrag',
  'Rede', 'Mündliche Frage', 'Zwischenfrage'
];

const DOC_CHUNK_TYPES = [
  'problem', 'loesung', 'alternativen', 'artikel',
  'begruendung', 'begruendung_allgemein', 'begruendung_besonders',
  'begruendung_artikel', 'vorbemerkung', 'question',
  'resolution', 'resolution_point', 'section', 'paragraph'
];

const SPEECH_TYPES = ['rede', 'befragung', 'fragestunde_antwort', 'kurzbeitrag', 'sonstiges'];
const SPEECH_CATEGORIES = ['rede', 'wortbeitrag'];

// Coverage is dynamic (grows as the indexer runs). State it as a note rather than
// a hard value list; call the *_search_status tools for live counts.
const WAHLPERIODE_NOTE =
  'Coverage is dynamic and grows as the background indexer runs. Semantic/protocol/document ' +
  'collections currently cover roughly WP 19 onward (WP 21 = current, since 2025; WP 20 = 2021–2025; ' +
  'WP 19 = 2017–2021). The DIP metadata/text tools reach all periods (1–21). Call ' +
  'bundestag_semantic_search_status / bundestag_protocol_search_status / bundestag_document_search_status ' +
  'for live indexed counts.';

// ---------------------------------------------------------------------------
// The static catalog, keyed by surface. Each filter is
// { field, type, values?, valueSource, note? }.
// ---------------------------------------------------------------------------
const SURFACES = {
  semantic_search: {
    tool: 'bundestag_semantic_search',
    description: 'Semantic (vector) search across all indexed Bundestag documents.',
    filters: [
      { field: 'docTypes', type: 'enum[]', values: ['drucksache', 'vorgang', 'aktivitaet', 'person'], valueSource: 'closed' },
      { field: 'entityTypes', type: 'enum[]', values: SEMANTIC_ENTITY_TYPES, valueSource: 'closed' },
      { field: 'wahlperiode', type: 'number', valueSource: 'dynamic', note: WAHLPERIODE_NOTE },
      { field: 'sachgebiet', type: 'string', valueSource: 'open', note: 'DIP subject area (Sachgebiet). Open set; examples: "Arbeit und Beschäftigung", "Umwelt", "Innere Sicherheit".' },
      { field: 'initiative', type: 'string', valueSource: 'open', note: 'Initiating faction/body, LONG names. Examples: "Bundesregierung", "CDU/CSU", "BÜNDNIS 90/DIE GRÜNEN".' },
      { field: 'fraktion', type: 'string', values: DIP_PARTY_LONG, valueSource: 'open', note: `LONG official party names. ${PARTY_NAMING_NOTE}` },
      { field: 'dateFrom', type: 'date (YYYY-MM-DD)', valueSource: 'freeform' },
      { field: 'dateTo', type: 'date (YYYY-MM-DD)', valueSource: 'freeform' },
      { field: 'sort', type: 'enum', values: ['relevance', 'newest', 'oldest'], valueSource: 'closed', note: 'Combine newest/oldest with dateFrom/dateTo for recent-first results in a window.' }
    ]
  },
  search_speeches: {
    tool: 'bundestag_search_speeches',
    description: 'Semantic search over parliamentary speeches (chunked Plenarprotokolle).',
    filters: [
      { field: 'speaker', type: 'string', valueSource: 'open', note: 'Full speaker name, e.g. "Friedrich Merz", "Olaf Scholz".' },
      { field: 'speakerParty', type: 'string', values: [...SPEECH_PARTY_SHORT, ...SPEECH_PARTY_HISTORICAL], valueSource: 'open', note: `SHORT party names as stored in the speeches collection (e.g. "GRÜNE", not "BÜNDNIS 90/DIE GRÜNEN"). ${PARTY_NAMING_NOTE} Historical (${SPEECH_PARTY_HISTORICAL.join(', ')}) appear in older protocols.` },
      { field: 'speakerState', type: 'string', values: BUNDESLAENDER, valueSource: 'closed', note: 'German federal state, for Bundesrat speakers.' },
      { field: 'top', type: 'string', valueSource: 'open', note: 'Agenda item, e.g. "TOP 1", "TOP 34".' },
      { field: 'wahlperiode', type: 'number', valueSource: 'dynamic', note: WAHLPERIODE_NOTE },
      { field: 'herausgeber', type: 'enum', values: ['BT', 'BR'], valueSource: 'closed', note: 'Publisher: BT (Bundestag) or BR (Bundesrat).' },
      { field: 'speechType', type: 'enum', values: SPEECH_TYPES, valueSource: 'closed', note: 'Single speech type. Also accepts speechTypes (array) for multiple.' },
      { field: 'category', type: 'enum', values: SPEECH_CATEGORIES, valueSource: 'closed', note: 'rede (formal speeches) vs wortbeitrag (contributions).' },
      { field: 'isGovernment', type: 'boolean', valueSource: 'closed', note: 'true = only ministers / state secretaries.' },
      { field: 'dateFrom', type: 'date (YYYY-MM-DD)', valueSource: 'freeform' },
      { field: 'dateTo', type: 'date (YYYY-MM-DD)', valueSource: 'freeform' },
      { field: 'sort', type: 'enum', values: ['relevance', 'newest', 'oldest'], valueSource: 'closed', note: 'Combine newest/oldest with dateFrom/dateTo for recent-first results in a window.' }
    ]
  },
  search_document_sections: {
    tool: 'bundestag_search_document_sections',
    description: 'Semantic search over document sections (chunked Drucksachen).',
    filters: [
      { field: 'drucksachetyp', type: 'enum', values: DRUCKSACHETYPEN.slice(0, 9), valueSource: 'closed', note: 'Document type. (Schriftliche Frage is not a document-section type.)' },
      { field: 'chunkType', type: 'enum', values: DOC_CHUNK_TYPES, valueSource: 'closed', note: 'Section type, e.g. artikel, question, problem, loesung.' },
      { field: 'wahlperiode', type: 'number', valueSource: 'dynamic', note: WAHLPERIODE_NOTE },
      { field: 'urheber', type: 'string', valueSource: 'open', note: 'Author/initiator. LONG names. Examples: "Bundesregierung", "CDU/CSU", "BÜNDNIS 90/DIE GRÜNEN".' },
      { field: 'dateFrom', type: 'date (YYYY-MM-DD)', valueSource: 'freeform' },
      { field: 'dateTo', type: 'date (YYYY-MM-DD)', valueSource: 'freeform' },
      { field: 'sort', type: 'enum', values: ['relevance', 'newest', 'oldest'], valueSource: 'closed', note: 'Combine newest/oldest with dateFrom/dateTo for recent-first results in a window.' }
    ]
  },
  dip: {
    tool: 'bundestag_search_drucksachen / _vorgaenge / _personen / _aktivitaeten / _plenarprotokolle',
    description: 'DIP API metadata search (title/type/date/author). No full-text search — use the semantic tools for content.',
    filters: [
      { field: 'drucksachetyp', type: 'enum', values: DRUCKSACHETYPEN, valueSource: 'closed', note: 'bundestag_search_drucksachen only.' },
      { field: 'vorgangstyp', type: 'string', valueSource: 'open', note: 'bundestag_search_vorgaenge. Examples: "Gesetzgebung", "Antrag", "Kleine Anfrage", "Selbständiger Antrag".' },
      { field: 'sachgebiet', type: 'string', valueSource: 'open', note: 'bundestag_search_vorgaenge. Open set; examples: "Umwelt", "Recht", "Wirtschaft".' },
      { field: 'fraktion', type: 'string', values: DIP_PARTY_LONG, valueSource: 'open', note: `bundestag_search_personen. LONG official names. ${PARTY_NAMING_NOTE}` },
      { field: 'urheber', type: 'string', valueSource: 'open', note: 'bundestag_search_drucksachen. Author/initiator, e.g. "Bundesregierung", "CDU/CSU".' },
      { field: 'initiative', type: 'string', valueSource: 'open', note: 'bundestag_search_vorgaenge. Initiating faction/body, LONG names.' },
      { field: 'aktivitaetsart', type: 'string', valueSource: 'open', note: 'bundestag_search_aktivitaeten. Examples: "Rede", "Frage", "Zwischenfrage", "Schriftliche Frage". Filtered client-side.' },
      { field: 'dokumentart', type: 'enum', values: ['Plenarprotokoll', 'Drucksache'], valueSource: 'closed', note: 'bundestag_search_aktivitaeten. Real DIP server-side filter.' },
      { field: 'wahlperiode', type: 'number', valueSource: 'closed', note: 'All DIP tools. 1–21 (21 = current). Full historical coverage.' },
      { field: 'datum_start / datum_end', type: 'date (YYYY-MM-DD)', valueSource: 'freeform', note: 'All DIP tools.' }
    ]
  }
};

const scopeSchema = z.enum(['all', 'semantic_search', 'search_speeches', 'search_document_sections', 'dip']).default('all')
  .describe('Which search surface to describe (default "all"): semantic_search, search_speeches, search_document_sections, or dip (metadata search).');

export const filterCatalogTool = {
  name: 'bundestag_get_filters',
  description: `List the available filter fields and their valid values for the Bundestag search tools.
Call this FIRST whenever you want to filter a search but are unsure of the exact accepted value —
especially for party/fraktion (short vs. long names differ by tool), document types, chunk/speech types,
and Sachgebiete. Returns, per search surface, an array of { field, type, values?, valueSource, note }.
valueSource: "closed" (enum — use exactly one of the listed values), "open" (free keyword; examples given),
"dynamic" (grows with indexing), "freeform" (e.g. a date). Read-only; makes no external calls.`,

  inputSchema: {
    scope: scopeSchema
  },

  handler(params) {
    const scope = params?.scope || 'all';
    const surfaces = scope === 'all'
      ? SURFACES
      : { [scope]: SURFACES[scope] };

    return {
      success: true,
      endpoint: 'get_filters',
      scope,
      partyNaming: {
        note: PARTY_NAMING_NOTE,
        speechesShortNames: [...SPEECH_PARTY_SHORT, ...SPEECH_PARTY_HISTORICAL],
        dipAndSemanticLongNames: DIP_PARTY_LONG
      },
      wahlperiodeCoverage: WAHLPERIODE_NOTE,
      surfaces
    };
  }
};

export const filterCatalogTools = [filterCatalogTool];
