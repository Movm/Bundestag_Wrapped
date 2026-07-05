/**
 * Abgeordnetenwatch API Client
 *
 * Thin, precision-first client for the Abgeordnetenwatch API (German MPs:
 * politicians, mandates, roll-call votes, Nebentätigkeiten). The API is public
 * (CC0, no key) but rate-limited to 30 req/min and has NO aggregate endpoints,
 * so this client follows two hard rules:
 *
 *  1. Every request is filtered server-side and bounded with an explicit
 *     `range_end` — we never pull unfiltered lists.
 *  2. Every response is trimmed to a minimal DTO before it leaves the client,
 *     and roll-call tallies are aggregated here (fetch ≤1000 votes, return
 *     four counts + per-fraction breakdown) so raw vote rows never reach the
 *     LLM context.
 *
 * Ported from the Grünerator TypeScript client, adapted to this repo's idioms:
 * in-memory cache (utils/cache.js), token-bucket rate limiting (utils/rateLimiter.js),
 * and withRetry (utils/retry.js). Its own 30 req/min limiter, separate from the
 * DIP API limiter, since the two hit different hosts with independent budgets.
 */

import { config } from '../config.js';
import { getCachedApiResponse, cacheApiResponse } from '../utils/cache.js';
import { debug, warn } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import { RateLimiter } from '../utils/rateLimiter.js';

const BASE_URL = config.abgeordnetenwatch.baseUrl;

// Dedicated limiter — the DIP limiter is a separate host/budget.
const limiter = new RateLimiter({
  requestsPerMinute: config.abgeordnetenwatch.rateLimitPerMinute,
  burstSize: config.abgeordnetenwatch.burstSize,
  maxWaitTime: 20000
});

const KNOWN_VOTES = ['yes', 'no', 'abstain', 'no_show'];

function emptyCounts() {
  return { yes: 0, no: 0, abstain: 0, no_show: 0 };
}

function stripHtml(html, max = 280) {
  if (!html) return null;
  const text = String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Keys carry literal filter operators (e.g. `label[cn]`) — encode values only.
function buildQuery(params) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

/**
 * Low-level GET against the Abgeordnetenwatch API: cache → rate-limit → retry.
 * Returns the parsed JSON body (envelope with `data` + `meta`), or throws.
 */
async function requestRaw(path, params = {}, { useCache = true } = {}) {
  if (useCache) {
    const cached = getCachedApiResponse(`aw/${path}`, params);
    if (cached) return cached;
  }

  const url = `${BASE_URL}/${path}${buildQuery(params)}`;

  const body = await withRetry(
    async () => {
      const acquired = await limiter.acquire();
      if (!acquired) {
        const err = new Error('Abgeordnetenwatch rate limit exceeded');
        err.code = 'RATE_LIMITED';
        err.status = 429;
        throw err;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.abgeordnetenwatch.timeout);
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'BundestagWrapped-MCP/1.0 (+https://github.com/Movm/Bundestag_Wrapped)'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          const err = new Error(`Abgeordnetenwatch API ${res.status}: ${text.slice(0, 200)}`);
          err.status = res.status;
          throw err;
        }
        return res.json();
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    },
    { maxRetries: 2, baseDelay: 1000, maxDelay: 4000 }
  );

  if (useCache) cacheApiResponse(`aw/${path}`, params, body);
  return body;
}

/** Fetch a list endpoint → `{ items, total }`, tolerating shape drift. */
async function fetchList(path, params, options = {}) {
  const raw = await requestRaw(path, params, options);
  const items = Array.isArray(raw?.data) ? raw.data : [];
  const total = raw?.meta?.result?.total ?? items.length;
  return { items, total };
}

// ── public, precision-first methods (all return trimmed DTOs) ───────────────

/** Resolve a name to candidate politicians (CONTAINS match on the full label). */
export async function searchPoliticians(name, limit = 5, options = {}) {
  const q = (name || '').trim();
  if (!q) return [];
  const { items } = await fetchList('politicians', { 'label[cn]': q, range_end: limit }, options);
  return items.map((p) => ({
    id: p.id,
    name: p.label ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    party: p.party?.label ?? null,
    url: p.abgeordnetenwatch_url ?? `https://www.abgeordnetenwatch.de/api/v2/politicians/${p.id}`
  }));
}

/** Newest mandate for a politician — the join key for votes and side-jobs. */
export async function getCurrentMandate(politicianId, options = {}) {
  const { items } = await fetchList(
    'candidacies-mandates',
    { politician: politicianId, sort_by: 'id', sort_direction: 'desc', range_end: 5 },
    options
  );
  const mandate = items.find((m) => m.type === 'mandate') ?? items[0];
  if (!mandate) return null;
  return {
    mandateId: mandate.id,
    politicianId,
    politicianName: mandate.politician?.label ?? '',
    parliamentPeriod: mandate.parliament_period?.label ?? '',
    fraction: mandate.fraction_membership?.[0]?.fraction?.label ?? null
  };
}

/** Recent votes for a mandate, optionally pinned to a single poll. */
export async function getVotes({ mandateId, pollId, limit = 15 }, options = {}) {
  const params = { mandate: mandateId, sort_by: 'id', sort_direction: 'desc', range_end: limit };
  if (pollId) params.poll = pollId;
  const { items } = await fetchList('votes', params, options);
  return items.map((v) => ({
    pollId: v.poll?.id ?? 0,
    pollLabel: v.poll?.label ?? '',
    vote: v.vote ?? 'unknown',
    fraction: v.fraction?.label ?? null,
    url: v.poll?.abgeordnetenwatch_url ?? ''
  }));
}

/** Side-jobs for a mandate, highest declared income first. */
export async function getSideJobs(mandateId, limit = 10, options = {}) {
  const { items } = await fetchList(
    'sidejobs',
    { mandates: mandateId, sort_by: 'income', sort_direction: 'desc', range_end: limit },
    options
  );
  return items.map((s) => ({
    label: s.label ?? '',
    organization: s.sidejob_organization?.label ?? null,
    income: s.income ?? null,
    incomeLevel: s.income_level != null ? Number.parseInt(s.income_level, 10) || null : null,
    interval: s.interval ?? null,
    year: s.job_title_extra ?? null,
    topics: (s.field_topics ?? []).map((t) => t.label ?? '').filter(Boolean)
  }));
}

/** Find polls by keyword and/or policy-area topic id. */
export async function searchPolls({ keyword, topicId, limit = 8 }, options = {}) {
  if (!keyword && !topicId) return [];
  // The polls endpoint 500s on sort_by=id (unlike votes/mandates); sort by poll date.
  const params = { sort_by: 'field_poll_date', sort_direction: 'desc', range_end: limit };
  if (keyword) params['label[cn]'] = keyword.trim();
  if (topicId) params.field_topics = topicId;
  const { items } = await fetchList('polls', params, options);
  return items.map((p) => ({
    pollId: p.id,
    label: p.label ?? '',
    date: p.field_poll_date ?? null,
    accepted: p.field_accepted ?? null,
    topics: (p.field_topics ?? []).map((t) => t.label ?? '').filter(Boolean),
    intro: p.field_intro ? stripHtml(p.field_intro) : null,
    url: p.abgeordnetenwatch_url ?? ''
  }));
}

/**
 * Aggregate ≤1000 raw vote rows into a roll-call tally: four counts + a
 * per-fraction breakdown. Pure — exported for unit testing.
 */
export function aggregateTally(voteRows) {
  const total = emptyCounts();
  const fractions = new Map();
  for (const v of voteRows) {
    const vote = v.vote ?? '';
    if (!KNOWN_VOTES.includes(vote)) continue;
    total[vote] += 1;
    const fracName = v.fraction?.label ?? 'fraktionslos';
    const frac = fractions.get(fracName) ?? emptyCounts();
    frac[vote] += 1;
    fractions.set(fracName, frac);
  }
  const byFraction = [...fractions.entries()]
    .map(([fraction, c]) => ({ fraction, ...c }))
    .sort((a, b) => b.yes + b.no - (a.yes + a.no));
  return { total, byFraction };
}

/**
 * Roll-call tally for a poll. The API has no aggregate endpoint, so we fetch
 * every vote (≤1000) and count here — returning only the aggregate, never the
 * raw rows.
 */
export async function getPollTally(pollId, options = {}) {
  const [pollRaw, votesResult] = await Promise.all([
    requestRaw(`polls/${pollId}`, {}, options),
    fetchList('votes', { poll: pollId, range_end: 1000 }, options)
  ]);
  const meta = pollRaw?.data ?? null;
  const { total, byFraction } = aggregateTally(votesResult.items);
  return {
    pollId,
    label: meta?.label ?? '',
    date: meta?.field_poll_date ?? null,
    accepted: meta?.field_accepted ?? null,
    total,
    byFraction,
    url: meta?.abgeordnetenwatch_url ?? ''
  };
}

/** Rate-limiter stats, for the cache/health tooling. */
export function getRateLimiterStats() {
  return limiter.getStats();
}
