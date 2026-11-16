#!/usr/bin/env node
/**
 * Backfill `herausgeber` (BT | BR) on the Drucksache chunks indexed before the
 * indexer started writing it. The DIP serves Bundesrat-Drucksachen from the
 * same endpoint, so the chunk collection mixes both chambers.
 *
 * 1. Collect the ids of all BR Drucksachen per configured Wahlperiode
 *    (`f.zuordnung=BR`, metadata only — no text, no embeddings).
 * 2. Mark their chunks `BR`.
 * 3. Mark every chunk still without `herausgeber` as `BT`.
 *
 * Idempotent; safe to re-run. `--dry-run` only counts.
 *
 *   node scripts/backfill-document-herausgeber.mjs [--dry-run]
 */

import { config } from '../src/config.js';
import { searchDrucksachen } from '../src/api/bundestag.js';
import { getClient } from '../src/services/qdrant/client.js';
import { ensureDocumentCollection } from '../src/services/qdrant/documentCollection.js';

const DRY_RUN = process.argv.includes('--dry-run');
const ID_BATCH = 500;
const collection = config.qdrant.documentCollection;

async function bundesratIds(wahlperiode) {
  const ids = [];
  let cursor = null;
  for (;;) {
    const page = await searchDrucksachen(
      { wahlperiode, zuordnung: 'BR', limit: 100, cursor },
      { useCache: false }
    );
    const docs = page.documents || [];
    ids.push(...docs.map((d) => Number(d.id)));
    if (docs.length === 0 || !page.cursor || page.cursor === cursor) return ids;
    cursor = page.cursor;
  }
}

async function main() {
  if (!(await ensureDocumentCollection())) throw new Error('Qdrant document collection unavailable');
  const qdrant = getClient();
  const count = async (filter) => (await qdrant.count(collection, { filter, exact: true })).count;

  for (const wahlperiode of config.indexer.wahlperioden) {
    const ids = await bundesratIds(wahlperiode);
    let chunks = 0;
    for (let i = 0; i < ids.length; i += ID_BATCH) {
      const filter = { must: [{ key: 'drucksache_id', match: { any: ids.slice(i, i + ID_BATCH) } }] };
      chunks += await count(filter);
      if (!DRY_RUN) await qdrant.setPayload(collection, { payload: { herausgeber: 'BR' }, filter, wait: true });
    }
    console.log(`WP${wahlperiode}: ${ids.length} BR-Drucksachen in DIP, ${chunks} chunks ${DRY_RUN ? 'would be' : ''} marked BR`);
  }

  const unmarked = { must: [{ is_empty: { key: 'herausgeber' } }] };
  const rest = await count(unmarked);
  if (!DRY_RUN) await qdrant.setPayload(collection, { payload: { herausgeber: 'BT' }, filter: unmarked, wait: true });
  console.log(`${rest} chunks without herausgeber ${DRY_RUN ? 'would be' : ''} marked BT`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
