/**
 * Qdrant Client - Core infrastructure for Qdrant vector database
 * Manages singleton client instance and health checking
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../../config.js';
import * as logger from '../../utils/logger.js';

let client = null;

/**
 * Get or create the Qdrant client singleton
 * @returns {QdrantClient|null}
 */
export function getClient() {
  if (!client && config.qdrant.enabled) {
    const options = { url: config.qdrant.url };
    // The Qdrant JS client defaults the REST port to 6333 even when the URL
    // omits one — so `https://host` (TLS-terminated behind a reverse proxy)
    // is still dialed as `host:6333` and fails. Derive the port from the URL:
    // its explicit port if present, else null so the protocol default
    // (443 for https, 80 for http) applies instead of the 6333 fallback.
    try {
      const parsed = new URL(config.qdrant.url);
      options.port = parsed.port ? Number(parsed.port) : null;
    } catch {
      // Malformed URL — let the client surface the error on first use.
    }
    if (config.qdrant.apiKey) {
      options.apiKey = config.qdrant.apiKey;
    }
    client = new QdrantClient(options);
    logger.info('QDRANT', `Client initialized for ${config.qdrant.url}`);
  }
  return client;
}

/**
 * Health check for Qdrant connection
 * @returns {Promise<boolean>}
 */
export async function healthCheck() {
  const qdrant = getClient();
  if (!qdrant) {
    return false;
  }

  try {
    await qdrant.getCollections();
    return true;
  } catch (err) {
    logger.warn('QDRANT', `Health check failed: ${err.message}`);
    return false;
  }
}
