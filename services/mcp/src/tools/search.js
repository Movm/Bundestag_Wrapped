/**
 * MCP Tools for Bundestag API search
 */

import { z } from 'zod';
import * as api from '../api/bundestag.js';
import { getCacheStats } from '../utils/cache.js';
import { config } from '../config.js';
import { analyzeSize } from '../utils/tokenEstimator.js';

// Common parameter schemas
const wahlperiodeSchema = z.number().int().min(1).max(30).optional()
  .describe('Electoral period (Wahlperiode), e.g., 20 for current');

const datumStartSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  .describe('Start date in YYYY-MM-DD format');

const datumEndSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  .describe('End date in YYYY-MM-DD format');

const limitSchema = z.number().int().min(1).max(100).default(10)
  .describe('Maximum number of results (1-100)');

const cursorSchema = z.string().optional()
  .describe('Pagination cursor from previous response');

const useCacheSchema = z.boolean().default(true)
  .describe('Whether to use cached results');

const fieldsSchema = z.enum(['compact', 'full']).default('compact')
  .describe('Response detail: "compact" (default — key fields only, safe for context) or "full" (raw DIP records, can be very large)');

// ============================================================================
// List-response helpers
// ============================================================================

// Compact field projections per endpoint. Without this, list search handlers
// return the full raw DIP object per row; a single unbounded search can exceed
// 150k characters and overflow the caller's context window. These field sets
// keep the identifying/metadata fields and drop deep nested payloads.
const PROJECTION_FIELDS = {
  drucksache: ['id', 'typ', 'titel', 'dokumentnummer', 'drucksachetyp', 'dokumentart', 'wahlperiode', 'datum', 'herausgeber', 'urheber', 'fundstelle'],
  plenarprotokoll: ['id', 'typ', 'titel', 'dokumentnummer', 'wahlperiode', 'datum', 'herausgeber', 'fundstelle'],
  vorgang: ['id', 'typ', 'titel', 'vorgangstyp', 'sachgebiet', 'wahlperiode', 'datum', 'beratungsstand', 'initiative', 'abstract'],
  person: ['id', 'typ', 'titel', 'nachname', 'vorname', 'namenszusatz', 'fraktion', 'funktion', 'person_roles', 'wahlperiode', 'datum'],
  aktivitaet: ['id', 'typ', 'titel', 'aktivitaetsart', 'dokumentart', 'wahlperiode', 'datum', 'vorgangsbezug'],
  vorgangsposition: ['id', 'typ', 'titel', 'vorgangstyp', 'wahlperiode', 'datum', 'zuordnung', 'fundstelle']
};

// Full-text endpoints carry the entire document text per row — replace with a snippet.
const TEXT_SNIPPET_CHARS = 600;

// Below this hit count, a title-substring search likely under-covered the topic,
// so we surface a hint pointing at semantic search.
const LOW_RECALL_THRESHOLD = 5;

function pickFields(obj, fields) {
  const out = {};
  for (const key of fields) {
    if (obj[key] !== undefined && obj[key] !== null) out[key] = obj[key];
  }
  return out;
}

function projectRow(endpoint, row) {
  if (endpoint === 'drucksache-text' || endpoint === 'plenarprotokoll-text') {
    const base = endpoint === 'drucksache-text' ? PROJECTION_FIELDS.drucksache : PROJECTION_FIELDS.plenarprotokoll;
    const projected = pickFields(row, base);
    const text = typeof row.text === 'string' ? row.text : (row.text?.text || '');
    if (text) {
      projected.textLength = text.length;
      projected.textSnippet = text.length > TEXT_SNIPPET_CHARS
        ? text.slice(0, TEXT_SNIPPET_CHARS) + '…'
        : text;
    }
    return projected;
  }
  const fields = PROJECTION_FIELDS[endpoint];
  return fields ? pickFields(row, fields) : row;
}

/**
 * Build a size-bounded list response for the search tools.
 * - Enforces `limit` (DIP may return a full page regardless of requested rows).
 * - Projects a compact field set by default (opt out with fields: 'full').
 * - Attaches a response-size estimate so callers can gauge context impact.
 */
function buildListResponse(endpoint, params, result) {
  const raw = result.documents || [];
  const limit = params.limit || config.dipApi.defaultLimit;
  const capped = raw.slice(0, limit);
  const useFull = params.fields === 'full';
  const results = useFull ? capped : capped.map((row) => projectRow(endpoint, row));

  const sizeAnalysis = analyzeSize(JSON.stringify(results), { language: 'german' });

  return {
    success: true,
    endpoint,
    query: params,
    totalResults: result.numFound || 0,
    returnedResults: results.length,
    apiReturned: raw.length,
    fields: useFull ? 'full' : 'compact',
    responseSize: {
      estimatedTokens: sizeAnalysis.estimatedTokens,
      category: sizeAnalysis.category
    },
    cursor: result.cursor || null,
    hasMore: !!(result.cursor),
    cached: result.cached,
    results
  };
}

// ============================================================================
// Drucksachen Tools
// ============================================================================

export const searchDrucksachenTool = {
  name: 'bundestag_search_drucksachen',
  description: `Search Bundestag Drucksachen (printed parliamentary documents) by metadata (title, type, date, author).
Includes: Gesetzentwürfe (bills), Anträge (motions), Anfragen (inquiries), and more.
Use this to find legislative documents, government proposals, and parliamentary inquiries.
For a concept/topic when you don't know exact wording, prefer bundestag_semantic_search.
To find a phrase inside document text, use bundestag_search_document_sections (semantic) or bundestag_search_drucksachen_text (raw).`,

  inputSchema: {
    query: z.string().optional()
      .describe('Search text in document title'),
    wahlperiode: wahlperiodeSchema,
    dokumentnummer: z.string().optional()
      .describe('Document number, e.g., "20/1234"'),
    drucksachetyp: z.enum([
      'Gesetzentwurf', 'Antrag', 'Kleine Anfrage', 'Große Anfrage',
      'Beschlussempfehlung und Bericht', 'Unterrichtung', 'Entschließungsantrag',
      'Änderungsantrag', 'Bericht', 'Schriftliche Frage'
    ]).optional()
      .describe('Type of document'),
    datum_start: datumStartSchema,
    datum_end: datumEndSchema,
    urheber: z.string().optional()
      .describe('Author/initiator of the document'),
    limit: limitSchema,
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchDrucksachen(params, { useCache: params.useCache });

      const response = buildListResponse('drucksache', params, result);
      // `query` is a literal DIP title-substring match, so a topical term
      // ("Klimaschutz") only finds documents with that exact word in the title
      // and silently misses the rest. When the hit count is low, nudge the
      // caller toward semantic search for full topic coverage.
      if (params.query && response.totalResults < LOW_RECALL_THRESHOLD) {
        response.hint = `'query' matches the document TITLE literally, so this found only ${response.totalResults} document(s) with "${params.query}" in the title — not all documents about the topic. For full concept coverage use bundestag_semantic_search; to search inside document text use bundestag_search_drucksachen_text.`;
      }
      return response;
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'drucksache'
      };
    }
  }
};

export const getDrucksacheTool = {
  name: 'bundestag_get_drucksache',
  description: 'Get a specific Drucksache (printed document) by its ID. Returns full metadata.',

  inputSchema: {
    id: z.number().int().positive()
      .describe('Drucksache ID'),
    includeFullText: z.boolean().default(false)
      .describe('Also fetch the full text content'),
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.getDrucksache(params.id, { useCache: params.useCache });

      if (!result) {
        return {
          error: true,
          message: `Drucksache with ID ${params.id} not found`,
          endpoint: 'drucksache'
        };
      }

      let fullText = null;
      if (params.includeFullText) {
        try {
          const textResult = await api.getDrucksacheText(params.id, { useCache: params.useCache });
          if (textResult) {
            fullText = textResult.text || textResult;
          }
        } catch (textErr) {
          // Full text may not be available for all documents
        }
      }

      return {
        success: true,
        endpoint: 'drucksache',
        id: params.id,
        cached: result.cached,
        data: result,
        fullText
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'drucksache',
        id: params.id
      };
    }
  }
};

// ============================================================================
// Plenarprotokolle Tools
// ============================================================================

export const searchPlenarprotokolleTool = {
  name: 'bundestag_search_plenarprotokolle',
  description: `Search Bundestag Plenarprotokolle (plenary session transcripts).
These are verbatim transcripts of parliamentary debates and votes.
Use this to find speeches, debates, and parliamentary proceedings.`,

  inputSchema: {
    query: z.string().optional()
      .describe('Search text in protocol title'),
    wahlperiode: wahlperiodeSchema,
    dokumentnummer: z.string().optional()
      .describe('Protocol number, e.g., "20/42"'),
    datum_start: datumStartSchema,
    datum_end: datumEndSchema,
    limit: limitSchema,
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchPlenarprotokolle(params, { useCache: params.useCache });

      return buildListResponse('plenarprotokoll', params, result);
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'plenarprotokoll'
      };
    }
  }
};

export const getPlenarprotokollTool = {
  name: 'bundestag_get_plenarprotokoll',
  description: 'Get a specific Plenarprotokoll (plenary protocol) by its ID.',

  inputSchema: {
    id: z.number().int().positive()
      .describe('Plenarprotokoll ID'),
    includeFullText: z.boolean().default(false)
      .describe('Also fetch the full transcript text'),
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.getPlenarprotokoll(params.id, { useCache: params.useCache });

      if (!result) {
        return {
          error: true,
          message: `Plenarprotokoll with ID ${params.id} not found`,
          endpoint: 'plenarprotokoll'
        };
      }

      let fullText = null;
      if (params.includeFullText) {
        try {
          const textResult = await api.getPlenarprotokollText(params.id, { useCache: params.useCache });
          if (textResult) {
            fullText = textResult.text || textResult;
          }
        } catch (textErr) {
          // Full text may not be available
        }
      }

      return {
        success: true,
        endpoint: 'plenarprotokoll',
        id: params.id,
        cached: result.cached,
        data: result,
        fullText
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'plenarprotokoll',
        id: params.id
      };
    }
  }
};

// ============================================================================
// Vorgaenge Tools
// ============================================================================

export const searchVorgaengeTool = {
  name: 'bundestag_search_vorgaenge',
  description: `Search Bundestag Vorgänge (parliamentary proceedings).
A Vorgang represents the lifecycle of a legislative process, linking related documents,
votes, and decisions. Use this to track bills through parliament.`,

  inputSchema: {
    query: z.string().optional()
      .describe('Search text in proceeding title'),
    wahlperiode: wahlperiodeSchema,
    vorgangstyp: z.string().optional()
      .describe('Type of proceeding (e.g., Gesetzgebung, Antrag)'),
    sachgebiet: z.string().optional()
      .describe('Subject area'),
    deskriptor: z.string().optional()
      .describe('Thesaurus keyword/descriptor'),
    initiative: z.string().optional()
      .describe('Initiating party or faction'),
    datum_start: datumStartSchema,
    datum_end: datumEndSchema,
    limit: limitSchema,
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchVorgaenge(params, { useCache: params.useCache });

      return buildListResponse('vorgang', params, result);
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'vorgang'
      };
    }
  }
};

export const getVorgangTool = {
  name: 'bundestag_get_vorgang',
  description: 'Get a specific Vorgang (proceeding) by its ID with all related documents.',

  inputSchema: {
    id: z.number().int().positive()
      .describe('Vorgang ID'),
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.getVorgang(params.id, { useCache: params.useCache });

      if (!result) {
        return {
          error: true,
          message: `Vorgang with ID ${params.id} not found`,
          endpoint: 'vorgang'
        };
      }

      return {
        success: true,
        endpoint: 'vorgang',
        id: params.id,
        cached: result.cached,
        data: result
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'vorgang',
        id: params.id
      };
    }
  }
};

// ============================================================================
// Personen Tools
// ============================================================================

export const searchPersonenTool = {
  name: 'bundestag_search_personen',
  description: `Search for persons in the Bundestag (MPs, ministers, etc.).
Use this to find information about members of parliament and their affiliations.`,

  inputSchema: {
    query: z.string().optional()
      .describe('Search by name'),
    wahlperiode: wahlperiodeSchema,
    fraktion: z.string().optional()
      .describe('Parliamentary group/faction (e.g., SPD, CDU/CSU, GRÜNE)'),
    limit: limitSchema,
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchPersonen(params, { useCache: params.useCache });

      return buildListResponse('person', params, result);
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'person'
      };
    }
  }
};

export const getPersonTool = {
  name: 'bundestag_get_person',
  description: 'Get detailed information about a specific person by their ID.',

  inputSchema: {
    id: z.number().int().positive()
      .describe('Person ID'),
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.getPerson(params.id, { useCache: params.useCache });

      if (!result) {
        return {
          error: true,
          message: `Person with ID ${params.id} not found`,
          endpoint: 'person'
        };
      }

      return {
        success: true,
        endpoint: 'person',
        id: params.id,
        cached: result.cached,
        data: result
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'person',
        id: params.id
      };
    }
  }
};

// ============================================================================
// Aktivitaeten Tools
// ============================================================================

export const searchAktivitaetenTool = {
  name: 'bundestag_search_aktivitaeten',
  description: `Search parliamentary activities (speeches, questions, etc.).
Use this to find specific contributions by MPs in parliament.`,

  inputSchema: {
    query: z.string().optional()
      .describe('Search text in activity title'),
    wahlperiode: wahlperiodeSchema,
    aktivitaetsart: z.string().optional()
      .describe('Type of activity (e.g., Rede, Schriftliche Frage)'),
    person_id: z.number().int().positive().optional()
      .describe('Filter by person ID'),
    datum_start: datumStartSchema,
    datum_end: datumEndSchema,
    limit: limitSchema,
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchAktivitaeten(params, { useCache: params.useCache });

      return buildListResponse('aktivitaet', params, result);
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'aktivitaet'
      };
    }
  }
};

export const getAktivitaetTool = {
  name: 'bundestag_get_aktivitaet',
  description: 'Get a specific parliamentary activity by its ID.',

  inputSchema: {
    id: z.number().int().positive()
      .describe('Aktivitaet ID'),
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.getAktivitaet(params.id, { useCache: params.useCache });

      if (!result) {
        return {
          error: true,
          message: `Aktivitaet with ID ${params.id} not found`,
          endpoint: 'aktivitaet'
        };
      }

      return {
        success: true,
        endpoint: 'aktivitaet',
        id: params.id,
        cached: result.cached,
        data: result
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'aktivitaet',
        id: params.id
      };
    }
  }
};

// ============================================================================
// Vorgangspositionen Tools
// ============================================================================

export const searchVorgangspositionenTool = {
  name: 'bundestag_search_vorgangspositionen',
  description: `Search Vorgangspositionen (proceeding positions/steps).
A Vorgangsposition represents a single step in a legislative proceeding (Vorgang),
such as a committee referral, vote, or decision. Use this to track detailed
progress of bills through parliament.`,

  inputSchema: {
    vorgang_id: z.number().int().positive().optional()
      .describe('Filter by Vorgang ID to get all positions of a specific proceeding'),
    wahlperiode: wahlperiodeSchema,
    datum_start: datumStartSchema,
    datum_end: datumEndSchema,
    limit: limitSchema,
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchVorgangspositionen(params, { useCache: params.useCache });

      return buildListResponse('vorgangsposition', params, result);
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'vorgangsposition'
      };
    }
  }
};

// ============================================================================
// Full-Text Search Tools
// ============================================================================

export const searchDrucksachenTextTool = {
  name: 'bundestag_search_drucksachen_text',
  description: `Raw full-text search within Drucksachen content (DIP API).
Unlike bundestag_search_drucksachen which searches metadata/titles,
this searches the actual document text. Use this to find specific
phrases, legal references, or exact wording within parliamentary documents.
For conceptual/semantic matching (related terms, not exact phrases), prefer
bundestag_search_document_sections, which searches vectorized document chunks.`,

  inputSchema: {
    query: z.string()
      .describe('Full-text search query within document content'),
    wahlperiode: wahlperiodeSchema,
    drucksache_id: z.number().int().positive().optional()
      .describe('Filter to a specific Drucksache ID'),
    limit: z.number().int().min(1).max(50).default(10)
      .describe('Maximum results (1-50, lower limit than metadata search)'),
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchDrucksachenText(params, { useCache: params.useCache });

      return buildListResponse('drucksache-text', params, result);
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'drucksache-text'
      };
    }
  }
};

export const searchPlenarprotokolleTextTool = {
  name: 'bundestag_search_plenarprotokolle_text',
  description: `Raw full-text search within Plenarprotokoll transcripts (DIP API).
Unlike bundestag_search_plenarprotokolle which searches metadata,
this searches actual speech transcripts. Use this to find specific
quotes or exact wording in plenary sessions.
For semantic search of what someone said about a topic (related terms, per-speech
results with speaker/party), prefer bundestag_search_speeches.`,

  inputSchema: {
    query: z.string()
      .describe('Full-text search query within transcript content'),
    wahlperiode: wahlperiodeSchema,
    plenarprotokoll_id: z.number().int().positive().optional()
      .describe('Filter to a specific Plenarprotokoll ID'),
    limit: z.number().int().min(1).max(50).default(10)
      .describe('Maximum results (1-50, lower limit than metadata search)'),
    cursor: cursorSchema,
    fields: fieldsSchema,
    useCache: useCacheSchema
  },

  async handler(params) {
    try {
      const result = await api.searchPlenarprotokolleText(params, { useCache: params.useCache });

      return buildListResponse('plenarprotokoll-text', params, result);
    } catch (err) {
      return {
        error: true,
        message: err.message,
        endpoint: 'plenarprotokoll-text'
      };
    }
  }
};

// ============================================================================
// Utility Tools
// ============================================================================

export const cacheStatsTool = {
  name: 'bundestag_cache_stats',
  description: 'Get cache statistics showing hit rates and entry counts.',

  inputSchema: {},

  async handler() {
    return {
      success: true,
      stats: getCacheStats()
    };
  }
};

export const estimateSizeTool = {
  name: 'bundestag_estimate_size',
  description: `Check the size of a document or protocol BEFORE fetching full text.
Returns estimated token count, size category, and recommendations.
Use this to avoid overwhelming your context window with large documents.

Categories:
- 🟢 tiny/small (<2k tokens): Safe to fetch
- 🟡 medium (2k-8k tokens): Consider if needed
- 🟠 large (8k-25k tokens): Fetch only if essential
- 🔴 very_large (25k-50k tokens): Avoid full text
- ⛔ massive (>50k tokens): Use text search instead`,

  inputSchema: {
    type: z.enum(['drucksache', 'plenarprotokoll'])
      .describe('Type of document to check'),
    id: z.number().int().positive()
      .describe('Document or protocol ID'),
    model: z.string().optional()
      .describe('Optional: specific model to check context usage for (e.g., "gpt-4o", "claude-3-sonnet")')
  },

  async handler(params) {
    try {
      let text = null;
      let metadata = null;

      if (params.type === 'drucksache') {
        // Get metadata first (small)
        metadata = await api.getDrucksache(params.id, { useCache: true });
        if (!metadata) {
          return {
            error: true,
            message: `Drucksache with ID ${params.id} not found`,
            type: params.type
          };
        }

        // Fetch text to measure
        try {
          const textResult = await api.getDrucksacheText(params.id, { useCache: true });
          text = textResult?.text || textResult || '';
        } catch {
          text = '';
        }
      } else if (params.type === 'plenarprotokoll') {
        // Get metadata first
        metadata = await api.getPlenarprotokoll(params.id, { useCache: true });
        if (!metadata) {
          return {
            error: true,
            message: `Plenarprotokoll with ID ${params.id} not found`,
            type: params.type
          };
        }

        // Fetch text to measure
        try {
          const textResult = await api.getPlenarprotokollText(params.id, { useCache: true });
          text = textResult?.text || textResult || '';
        } catch {
          text = '';
        }
      }

      // Analyze the size
      const analysis = analyzeSize(text, {
        language: 'german',
        model: params.model
      });

      // Build document info
      const docInfo = {
        type: params.type,
        id: params.id,
        title: metadata?.titel || metadata?.title || 'Unknown',
        date: metadata?.datum || metadata?.date || null,
        dokumentnummer: metadata?.dokumentnummer || null
      };

      return {
        success: true,
        document: docInfo,
        hasText: text.length > 0,
        size: {
          characters: analysis.characters,
          words: analysis.words,
          lines: analysis.lines,
          estimatedTokens: analysis.estimatedTokens
        },
        category: analysis.category,
        categoryEmoji: analysis.emoji,
        recommendation: analysis.recommendation,
        contextImpact: analysis.contextImpact,
        contextUsage: analysis.contextUsage,
        summary: analysis.summary,
        tip: analysis.category === 'large' || analysis.category === 'very_large' || analysis.category === 'massive'
          ? 'Consider using bundestag_search_' + params.type + (params.type === 'drucksache' ? 'n' : '') + '_text to find specific content instead of fetching full text.'
          : null
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        type: params.type,
        id: params.id
      };
    }
  }
};

// Export all tools as array for easy registration
export const allTools = [
  // Drucksachen (Documents)
  searchDrucksachenTool,
  getDrucksacheTool,
  searchDrucksachenTextTool,
  // Plenarprotokolle (Plenary Protocols)
  searchPlenarprotokolleTool,
  getPlenarprotokollTool,
  searchPlenarprotokolleTextTool,
  // Vorgaenge (Proceedings)
  searchVorgaengeTool,
  getVorgangTool,
  searchVorgangspositionenTool,
  // Personen (Persons)
  searchPersonenTool,
  getPersonTool,
  // Aktivitaeten (Activities)
  searchAktivitaetenTool,
  getAktivitaetTool,
  // Utility
  cacheStatsTool,
  estimateSizeTool
];
