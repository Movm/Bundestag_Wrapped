/**
 * Key-protected REST API for external notebook retrieval (#227).
 *
 *   POST /api/v1/search   — vector (or query) → hits across speeches + Drucksachen
 *   POST /api/v1/chunks   — neighbour chunks of one unit
 *   POST /api/v1/facets   — value counts per unit
 *
 * `Authorization: Bearer <key>`, keys from `NOTEBOOK_API_KEYS`. The response
 * schemas below are the contract (consumer: Grünerator,
 * `apps/api/services/notebook/remoteSources/bundestagWrapped.ts`); a change
 * here is a change there.
 */

import { timingSafeEqual } from 'node:crypto';
import express from 'express';
import { z } from 'zod';

import { config } from '../config.js';
import { embed } from '../services/embeddingService.js';
import * as logger from '../utils/logger.js';
import { chunks, facets, FACET_FIELDS, search } from './service.js';

const LOG_PREFIX = 'NOTEBOOK_API';

const source = z.enum(['speeches', 'documents']);
const list = (item) => z.array(item).max(50).optional();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const filtersSchema = z
  .object({
    party: list(z.string()),
    wahlperiode: list(z.number().int()),
    speaker: list(z.string()),
    drucksachetyp: list(z.string()),
    urheber: list(z.string()),
    section_type: list(z.string()),
    from: day.optional(),
    to: day.optional()
  })
  .strict();

export const searchRequestSchema = z
  .object({
    vector: z.array(z.number()).length(config.qdrant.vectorSize).optional(),
    query: z.string().max(2000).optional(),
    sources: z.array(source).min(1).optional(),
    filters: filtersSchema.default({}),
    limit: z.number().int().min(1).max(100).default(30),
    scoreThreshold: z.number().min(0).max(1).optional()
  })
  .strict()
  .refine((r) => r.vector || r.query, { message: 'vector or query is required' });

export const chunksRequestSchema = z
  .object({
    source,
    doc_id: z.string().min(1),
    chunk_indexes: z.array(z.number().int().min(0)).min(1).max(50)
  })
  .strict();

export const facetsRequestSchema = z
  .object({
    field: z.enum(FACET_FIELDS),
    sources: z.array(source).min(1).optional(),
    filters: filtersSchema.default({}),
    limit: z.number().int().min(1).max(200).default(50)
  })
  .strict();

const chunkSchema = z.object({
  id: z.string(),
  source,
  doc_id: z.string(),
  chunk_index: z.number().int(),
  title: z.string(),
  url: z.string().nullable(),
  date: z.string().nullable(),
  wahlperiode: z.number().int().nullable(),
  dokumentnummer: z.string().nullable(),
  speaker: z.string().nullable(),
  party: z.array(z.string()),
  drucksachetyp: z.string().nullable(),
  urheber: z.array(z.string()),
  section_type: z.string().nullable(),
  text: z.string()
});

export const searchResponseSchema = z.object({
  results: z.array(chunkSchema.extend({ score: z.number(), excerpt: z.string().nullable() }))
});
export const chunksResponseSchema = z.object({ chunks: z.array(chunkSchema) });
export const facetsResponseSchema = z.object({
  values: z.array(z.object({ value: z.union([z.string(), z.number()]), count: z.number() }))
});

function keyMatches(given, keys) {
  const a = Buffer.from(given);
  return keys.some((key) => {
    const b = Buffer.from(key);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

function requireKey(req, res, next) {
  const header = req.get('authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!given || !keyMatches(given, config.notebookApi.keys)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  req.notebookApiKey = given;
  next();
}

/** Fixed one-minute window per key — rejects instead of queueing. */
function rateLimit() {
  const windows = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.notebookApiKey;
    const w = windows.get(key);
    if (!w || now - w.start >= 60_000) {
      windows.set(key, { start: now, count: 1 });
      return next();
    }
    if (++w.count > config.notebookApi.requestsPerMinute) {
      res.set('Retry-After', String(Math.ceil((w.start + 60_000 - now) / 1000)));
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}

function handler(requestSchema, responseSchema, run) {
  return async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_request', issues: parsed.error.issues });
    }
    try {
      const body = responseSchema.parse(await run(parsed.data));
      res.json(body);
    } catch (err) {
      logger.error(LOG_PREFIX, `${req.path} failed: ${logger.errDetail(err)}`);
      res.status(503).json({ error: 'unavailable' });
    }
  };
}

export function createNotebookApiRouter() {
  const router = express.Router();
  router.use(requireKey, rateLimit());

  router.post(
    '/search',
    handler(searchRequestSchema, searchResponseSchema, async (r) => ({
      results: await search({ ...r, vector: r.vector ?? (await embed(r.query)) })
    }))
  );
  router.post(
    '/chunks',
    handler(chunksRequestSchema, chunksResponseSchema, async (r) => ({ chunks: await chunks(r) }))
  );
  router.post(
    '/facets',
    handler(facetsRequestSchema, facetsResponseSchema, async (r) => ({ values: await facets(r) }))
  );
  return router;
}
