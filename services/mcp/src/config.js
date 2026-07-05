/**
 * Configuration for Bundestag MCP Server
 */

import 'dotenv/config';

export const config = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    publicUrl: process.env.PUBLIC_URL || null
  },

  analysis: {
    url: process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000',
    timeout: 60000  // 60s for large protocol analysis
  },

  dipApi: {
    baseUrl: 'https://search.dip.bundestag.de/api/v1',
    apiKey: process.env.DIP_API_KEY,
    defaultLimit: 10,
    maxLimit: 100,
    timeout: 30000
  },

  // Abgeordnetenwatch — public transparency API (CC0, no key). Adds MP voting
  // behaviour, side-jobs and roll-call tallies on top of the official DIP record.
  // Fair-use limit is 30 req/min, so it gets its own limiter and a longer TTL.
  abgeordnetenwatch: {
    baseUrl: 'https://www.abgeordnetenwatch.de/api/v2',
    rateLimitPerMinute: 30,
    burstSize: 5,
    timeout: 15000
  },

  cache: {
    apiResponseTTL: 5 * 60 * 1000,      // 5 minutes for API responses
    entityTTL: 15 * 60 * 1000,          // 15 minutes for single entities
    metadataTTL: 24 * 60 * 60 * 1000,   // 24 hours for metadata
    maxApiResponseEntries: 500,
    maxEntityEntries: 200,
    maxMetadataEntries: 50
  },

  qdrant: {
    enabled: process.env.QDRANT_ENABLED === 'true',
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || null,
    collection: 'bundestag-docs',
    protocolCollection: 'bundestag-protocol-chunks',
    documentCollection: 'bundestag-document-chunks',
    vectorSize: 1024  // Mistral embed dimensions
  },

  mistral: {
    apiKey: process.env.MISTRAL_API_KEY,
    embeddingModel: 'mistral-embed',
    batchSize: 32
  },

  indexer: {
    enabled: process.env.INDEXER_ENABLED === 'true',
    intervalMinutes: parseInt(process.env.INDEXER_INTERVAL_MINUTES) || 15,
    // Full-text chunk indexers (Drucksachen sections + protocol speeches) run on
    // their own, longer interval and are gated by their own flags. They still
    // require INDEXER_ENABLED + QDRANT + Mistral (start() bails without them).
    chunkIntervalMinutes: parseInt(process.env.INDEXER_CHUNK_INTERVAL_MINUTES) || 60,
    documentIndexingEnabled: process.env.DOCUMENT_INDEXING_ENABLED === 'true',
    protocolIndexingEnabled: process.env.PROTOCOL_INDEXING_ENABLED === 'true',
    wahlperioden: (process.env.INDEXER_WAHLPERIODEN || '19,20,21').split(',').map(Number)
  },

  entityTypes: {
    drucksachetypen: [
      'Gesetzentwurf',
      'Antrag',
      'Kleine Anfrage',
      'Große Anfrage',
      'Beschlussempfehlung und Bericht',
      'Unterrichtung',
      'Entschließungsantrag',
      'Änderungsantrag',
      'Bericht',
      'Schriftliche Frage'
    ],
    vorgangstypen: [
      'Gesetzgebung',
      'Antrag',
      'Kleine Anfrage',
      'Große Anfrage',
      'Selbständiger Antrag',
      'Entschließungsantrag'
    ],
    aktivitaetsarten: [
      'Rede',
      'Schriftliche Frage',
      'Mündliche Frage',
      'Zwischenfrage'
    ]
  }
};

/**
 * Validate configuration at startup
 */
export function validateConfig() {
  if (!config.dipApi.apiKey) {
    throw new Error(
      'DIP_API_KEY environment variable is required.\n' +
      'Public test key (valid until 05/2027): R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ\n' +
      'Or request your own key: parlamentsdokumentation@bundestag.de'
    );
  }

  // Semantic search needs Mistral embeddings — fail fast rather than crashing
  // the indexer / search tools at runtime with cryptic errors.
  if (config.qdrant.enabled && !config.mistral.apiKey) {
    throw new Error(
      'MISTRAL_API_KEY is required when QDRANT_ENABLED=true (semantic search uses Mistral embeddings).\n' +
      'Set MISTRAL_API_KEY, or disable semantic search with QDRANT_ENABLED=false.'
    );
  }

  // The background indexer writes to Qdrant — it cannot run without it.
  if (config.indexer.enabled && !config.qdrant.enabled) {
    throw new Error('INDEXER_ENABLED=true requires QDRANT_ENABLED=true.');
  }

  // A malformed ANALYSIS_SERVICE_URL would only surface on the first NLP call.
  if (config.analysis.url && !isValidHttpUrl(config.analysis.url)) {
    throw new Error(`ANALYSIS_SERVICE_URL is not a valid http(s) URL: ${config.analysis.url}`);
  }
}

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
