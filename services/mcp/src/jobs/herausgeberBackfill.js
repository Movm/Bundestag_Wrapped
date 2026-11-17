/**
 * Backfill `herausgeber` (BT | BR) on Drucksache chunks indexed before the
 * indexer started writing it. The DIP serves Bundesrat-Drucksachen from the
 * same endpoint, so the chunk collection mixes both chambers.
 *
 * Runs before every document indexing pass and returns at once when no chunk
 * lacks the field, so it heals the existing collection on the first pass after
 * deploy without anyone running a script inside the container.
 *
 * Order matters: BR ids first, then everything still unmarked becomes BT. An
 * interrupted run leaves unmarked chunks behind and simply repeats next pass.
 */

const ID_BATCH = 500;
const UNMARKED = { must: [{ is_empty: { key: 'herausgeber' } }] };

async function bundesratIds(searchDrucksachen, wahlperiode) {
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

/** @returns {Promise<{ bundesrat: number, bundestag: number }>} BR Drucksachen marked, chunks marked BT. */
export async function backfillDocumentHerausgeber({ qdrant, collection, wahlperioden, searchDrucksachen }) {
  const unmarkedCount = async () => (await qdrant.count(collection, { filter: UNMARKED, exact: true })).count;
  if ((await unmarkedCount()) === 0) return { bundesrat: 0, bundestag: 0 };

  let bundesrat = 0;
  for (const wahlperiode of wahlperioden) {
    const ids = await bundesratIds(searchDrucksachen, wahlperiode);
    bundesrat += ids.length;
    for (let i = 0; i < ids.length; i += ID_BATCH) {
      await qdrant.setPayload(collection, {
        payload: { herausgeber: 'BR' },
        filter: { must: [{ key: 'drucksache_id', match: { any: ids.slice(i, i + ID_BATCH) } }] },
        wait: true
      });
    }
  }

  const bundestag = await unmarkedCount();
  await qdrant.setPayload(collection, { payload: { herausgeber: 'BT' }, filter: UNMARKED, wait: true });
  return { bundesrat, bundestag };
}
