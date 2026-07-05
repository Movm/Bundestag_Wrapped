#!/usr/bin/env node
// Smoke test for the live Bundestag MCP server.
//
// Pings the server, lists its tools, then calls every *content* tool (the ones
// that return real Bundestag data / analysis) with realistic, chained arguments
// and grades each result by quality — non-empty, expected shape, response size,
// latency. Real result previews are logged so a human can eyeball quality too.
//
//   node scripts/smoke-test.mjs [serverUrl]
//   MCP_URL=http://localhost:8080 node scripts/smoke-test.mjs
//
// Exit code is non-zero if any content tool FAILs (WARN does not fail the run).

import fs from 'fs';

const SERVER = (process.argv[2] || process.env.MCP_URL || 'https://mcp.bundestag-wrapped.de').replace(/\/$/, '');
const ENDPOINT = `${SERVER}/mcp`;
const OUT = new URL('../smoke-results.json', import.meta.url).pathname;
const SLOW_MS = 12_000;

let rpcId = 1;

async function rpc(method, params) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: rpcId++, method, params }),
  });
  const raw = await res.text();
  // Stateless mode replies with plain JSON; be lenient and also accept SSE frames.
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    const line = raw.split('\n').find((l) => l.startsWith('data:'));
    json = line ? JSON.parse(line.slice(5).trim()) : null;
  }
  if (!json) throw new Error(`Unparseable response (${res.status}): ${raw.slice(0, 200)}`);
  if (json.error) throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
  return json.result;
}

async function callTool(name, args) {
  const started = Date.now();
  let result, text, data, isError = false, error = null;
  try {
    result = await rpc('tools/call', { name, arguments: args });
    isError = !!result.isError;
    text = (result.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    try { data = JSON.parse(text); } catch { data = null; }
  } catch (e) {
    error = e.message;
  }
  return { ms: Date.now() - started, text, data, isError, error };
}

// Pull the first plausible record id out of any search response shape.
// DIP ids come back as strings; the get_* tools want numbers, so coerce.
function firstId(data) {
  if (!data) return null;
  const arr = data.results || data.documents || data.persons || data.items || data.aktivitaeten || (Array.isArray(data) ? data : null);
  if (!Array.isArray(arr)) return null;
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    let raw = item.id;
    if (raw == null) {
      const key = Object.keys(item).find((k) => k === 'id' || k.endsWith('_id') || k === 'dip_id' || k === 'docId');
      if (key) raw = item[key];
    }
    if (raw == null) continue;
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return null;
}

function countOf(data) {
  if (!data) return null;
  const arr = data.results || data.documents || data.persons || data.items || data.aktivitaeten || (Array.isArray(data) ? data : null);
  return Array.isArray(arr) ? arr.length : null;
}

const ctx = {};
const log = [];

// A step: { id, tool, args (obj | ()=>obj), grade(r)->{verdict,note}, capture(r) }
const steps = [
  // ── DIP metadata search ──────────────────────────────────────────────
  {
    tool: 'bundestag_search_drucksachen',
    args: { query: 'Klimaschutz', wahlperiode: 21, limit: 3 },
    capture: (r) => { ctx.drucksacheId = firstId(r.data); },
    grade: (r) => graded(countOf(r.data) > 0, `${countOf(r.data)} Drucksachen, id=${firstId(r.data)}`),
  },
  {
    tool: 'bundestag_search_plenarprotokolle',
    args: { wahlperiode: 21, limit: 3 },
    capture: (r) => { ctx.protokollId = firstId(r.data); },
    grade: (r) => graded(countOf(r.data) > 0, `${countOf(r.data)} Protokolle, newest id=${firstId(r.data)}`),
  },
  {
    tool: 'bundestag_search_vorgaenge',
    args: { query: 'Energie', wahlperiode: 21, limit: 3 },
    capture: (r) => { ctx.vorgangId = firstId(r.data); },
    grade: (r) => graded(countOf(r.data) > 0, `${countOf(r.data)} Vorgänge, id=${firstId(r.data)}`),
  },
  {
    tool: 'bundestag_search_personen',
    args: { query: 'Merz', limit: 3 },
    capture: (r) => { ctx.personId = firstId(r.data); },
    grade: (r) => graded(countOf(r.data) > 0, `${countOf(r.data)} Personen, id=${firstId(r.data)}`),
  },
  {
    tool: 'bundestag_search_aktivitaeten',
    args: { wahlperiode: 21, limit: 3 },
    capture: (r) => { ctx.aktivitaetId = firstId(r.data); },
    grade: (r) => graded(countOf(r.data) > 0, `${countOf(r.data)} Aktivitäten, id=${firstId(r.data)}`),
  },
  {
    tool: 'bundestag_search_vorgangspositionen',
    args: () => ({ vorgang_id: ctx.vorgangId, wahlperiode: 21, limit: 3 }),
    skipIf: () => !ctx.vorgangId,
    grade: (r) => graded(countOf(r.data) != null, `${countOf(r.data)} Positionen for Vorgang ${ctx.vorgangId}`),
  },
  // ── DIP get-by-id ────────────────────────────────────────────────────
  {
    tool: 'bundestag_get_drucksache',
    args: () => ({ id: ctx.drucksacheId, includeFullText: false }),
    skipIf: () => !ctx.drucksacheId,
    grade: (r) => graded(!!(r.data?.data && (r.data.data.titel || r.data.data.dokumentnummer)), (r.data?.data?.titel || r.data?.data?.dokumentnummer)?.slice(0, 80)),
  },
  {
    tool: 'bundestag_get_plenarprotokoll',
    args: () => ({ id: ctx.protokollId, includeFullText: false }),
    skipIf: () => !ctx.protokollId,
    grade: (r) => graded(!!(r.data?.data && r.data.data.dokumentnummer), r.data?.data?.dokumentnummer),
  },
  {
    tool: 'bundestag_get_vorgang',
    args: () => ({ id: ctx.vorgangId }),
    skipIf: () => !ctx.vorgangId,
    grade: (r) => graded(!!(r.data?.data && r.data.data.titel), r.data?.data?.titel?.slice(0, 80)),
  },
  {
    tool: 'bundestag_get_person',
    args: () => ({ id: ctx.personId }),
    skipIf: () => !ctx.personId,
    grade: (r) => graded(!!(r.data?.data && (r.data.data.nachname || r.data.data.vorname)), `${r.data?.data?.vorname ?? ''} ${r.data?.data?.nachname ?? ''}`.trim()),
  },
  {
    tool: 'bundestag_get_aktivitaet',
    args: () => ({ id: ctx.aktivitaetId }),
    skipIf: () => !ctx.aktivitaetId,
    grade: (r) => graded(!!(r.data?.data && (r.data.data.aktivitaetsart || r.data.data.titel)), r.data?.data?.aktivitaetsart || r.data?.data?.titel),
  },
  // ── Full-text RETRIEVAL (DIP has no free-text search — expect a redirect note) ─
  {
    tool: 'bundestag_search_drucksachen_text',
    args: { query: 'Klimaschutz Emissionen', wahlperiode: 21, limit: 2 },
    // DIP has no full-text search: a free-text query SHOULD be refused with a
    // redirect to the semantic tool — that refusal is the correct behaviour.
    errorIsOk: (text) => /does not support full-?text|semantic|search_document_sections|kein.*volltext/i.test(text || ''),
    grade: (r) => graded(true, 'correctly refuses free-text, redirects to semantic search'),
  },
  {
    tool: 'bundestag_search_plenarprotokolle_text',
    args: () => ({ plenarprotokoll_id: ctx.protokollId, wahlperiode: 21, limit: 2 }),
    skipIf: () => !ctx.protokollId,
    grade: (r) => graded(!r.isError, 'retrieval by protokoll id ok'),
  },
  // ── Semantic (vector) layer ──────────────────────────────────────────
  {
    tool: 'bundestag_semantic_search',
    args: { query: 'Reform des Bürgergeldes', limit: 3, wahlperiode: 21 },
    grade: (r) => scored(r.data, 'semantic hits'),
  },
  {
    tool: 'bundestag_search_speeches',
    args: { query: 'Klimaschutz', limit: 20, wahlperiode: 21, fields: 'full' },
    capture: (r) => { ctx.speeches = (r.data?.results || []).filter((s) => s && s.text); },
    grade: (r) => scored(r.data, 'speeches', 'speaker'),
  },
  {
    tool: 'bundestag_search_document_sections',
    args: { query: 'Rente Altersvorsorge', limit: 3, wahlperiode: 21 },
    grade: (r) => scored(r.data, 'document sections'),
  },
  // ── Analysis / NLP ───────────────────────────────────────────────────
  {
    tool: 'bundestag_analyze_tone',
    args: { text: 'Wir müssen endlich handeln und gemeinsam Verantwortung für den Klimaschutz übernehmen. Die Regierung versagt auf ganzer Linie.' },
    grade: (r) => {
      const t = r.data?.tone_scores;
      return graded(!!t && Object.keys(t).length > 0, t ? `aggression=${t.aggression} affirmative=${t.affirmative} solution=${t.solution_focus}` : preview(r.text));
    },
  },
  {
    tool: 'bundestag_classify_topics',
    args: { text: 'Die Energiewende erfordert massive Investitionen in erneuerbare Energien, Netzausbau und den Schutz des Klimas.' },
    grade: (r) => {
      const t = r.data?.topic_scores;
      if (!t) return graded(false, preview(r.text));
      const top = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
      return graded(top && top[1] > 0, `top topic: ${top?.[0]}=${top?.[1]}`);
    },
  },
  {
    tool: 'bundestag_analyze_text',
    args: { text: 'Wir fordern eine sozial gerechte Klimapolitik. Die steigenden Mieten belasten Familien. Bildung muss für alle zugänglich bleiben.', include_tone: true, include_topics: true, top_n: 10 },
    grade: (r) => graded(!!(r.data && (r.data.top_nouns || r.data.total_nouns != null)), `nouns=${r.data?.total_nouns} top=${r.data?.top_nouns?.[0]?.word}`),
  },
  {
    tool: 'bundestag_extract_speeches',
    args: () => ({ plenarprotokoll_id: ctx.protokollId, fields: 'compact', limit: 3 }),
    skipIf: () => !ctx.protokollId,
    grade: (r) => {
      const n = r.data?.speeches?.length ?? r.data?.speech_count ?? 0;
      return graded(n > 0, `${n} speeches extracted from protokoll ${ctx.protokollId}`);
    },
  },
  {
    // Speaker-filtered fetch so the profile analyses one coherent speaker.
    tool: 'bundestag_search_speeches',
    label: 'bundestag_search_speeches (speaker filter)',
    args: { query: 'Friedrich Merz', speaker: 'Friedrich Merz', limit: 30, wahlperiode: 21, fields: 'full' },
    capture: (r) => { ctx.merzSpeeches = (r.data?.results || []).filter((s) => s && s.text); },
    grade: (r) => graded(countOf(r.data) > 0, `${countOf(r.data)} Merz speeches for profiling`),
  },
  {
    tool: 'bundestag_speaker_profile',
    args: () => ({ speaker_name: 'Friedrich Merz', speeches: (ctx.merzSpeeches || []).slice(0, 30) }),
    skipIf: () => !(ctx.merzSpeeches && ctx.merzSpeeches.length),
    grade: (r) => {
      const p = r.data?.profile;
      if (!p) return graded(false, preview(r.text));
      const coherent = !p.last_name || /merz/i.test(`${p.name} ${p.last_name}`);
      return graded(true, `${p.total_speeches ?? p.statistics?.total_speeches ?? '?'} speeches, name=${p.name}${coherent ? '' : ` ⚠ derived=${p.first_name} ${p.last_name}`}`, coherent ? undefined : 'WARN');
    },
  },
  {
    tool: 'bundestag_compare_parties',
    args: () => ({ speeches: (ctx.speeches || []).slice(0, 20) }),
    skipIf: () => !(ctx.speeches && ctx.speeches.length),
    grade: (r) => {
      const c = r.data?.comparison;
      return graded(!!(c && c.parties_compared?.length), c ? `parties: ${c.parties_compared?.join(', ')}` : preview(r.text));
    },
  },
  // ── Aggregations / lifecycle ─────────────────────────────────────────
  {
    tool: 'bundestag_count',
    args: { entity: 'drucksache', drucksachetyp: 'Kleine Anfrage', wahlperiode: 21 },
    grade: (r) => graded(!!(r.data && (r.data.count != null || r.data.total != null)), `count=${r.data?.count ?? r.data?.total}`),
  },
  {
    tool: 'bundestag_vorgang_timeline',
    args: () => ({ vorgang_id: ctx.vorgangId }),
    skipIf: () => !ctx.vorgangId,
    grade: (r) => graded(!!(r.data && (r.data.steps || r.data.documents)), `${r.data?.steps?.length ?? 0} steps`),
  },
  {
    tool: 'bundestag_estimate_size',
    args: () => ({ type: 'plenarprotokoll', id: ctx.protokollId }),
    skipIf: () => !ctx.protokollId,
    grade: (r) => graded(r.data?.size?.estimatedTokens != null, `~${r.data?.size?.estimatedTokens} tokens (${r.data?.category}) — ${r.data?.document?.dokumentnummer}`),
  },
];

function graded(ok, note, forceVerdict) {
  return { verdict: forceVerdict || (ok ? 'PASS' : 'FAIL'), note: note || '' };
}
function scored(data, label, extraField) {
  const arr = data?.results || data?.documents || [];
  const n = arr.length;
  const scoreOf = (x) => Number(x.score ?? x._score ?? x.similarity);
  const withScore = arr.filter((x) => Number.isFinite(scoreOf(x))).length;
  const hasExtra = extraField ? arr.every((x) => x[extraField] != null) : true;
  if (n === 0) return graded(false, `0 ${label}`);
  if (withScore < n) return graded(true, `${n} ${label} but ${n - withScore} missing score`, 'WARN');
  if (!hasExtra) return graded(true, `${n} ${label} but some missing ${extraField}`, 'WARN');
  return graded(true, `${n} ${label}, top score ${scoreOf(arr[0]).toFixed(3)}`);
}
function preview(text) {
  return (text || '').replace(/\s+/g, ' ').slice(0, 120);
}

// ── Run ──────────────────────────────────────────────────────────────
console.log(`\n🔥 Bundestag MCP smoke test → ${SERVER}\n`);

// 1. Server ping + tool inventory
let toolList;
try {
  const health = await fetch(`${SERVER}/health/deep`).then((r) => r.json()).catch(() => null);
  const fresh = health?.checks?.dataFreshness || health?.dataFreshness;
  console.log(`health/deep: ${health?.status ?? health?.ok ?? '??'}  freshness=${fresh?.status ?? '?'}  latestDoc=${fresh?.latestDipDocumentDate ?? '?'}  indexed=${fresh?.indexedPoints ?? '?'}`);
  toolList = await rpc('tools/list', {});
  console.log(`tools/list: ${toolList.tools.length} tools exposed\n`);
} catch (e) {
  console.error(`❌ Server unreachable: ${e.message}`);
  process.exit(1);
}

const counts = { PASS: 0, WARN: 0, FAIL: 0, SKIP: 0 };
for (const step of steps) {
  if (step.skipIf && step.skipIf()) {
    counts.SKIP++;
    console.log(`  SKIP  ${step.tool.padEnd(38)} (missing prerequisite id)`);
    log.push({ tool: step.tool, verdict: 'SKIP' });
    continue;
  }
  const label = step.label || step.tool;
  const args = typeof step.args === 'function' ? step.args() : step.args;
  const r = await callTool(step.tool, args);
  let verdict, note;
  const errText = r.error || r.text;
  if ((r.error || r.isError) && step.errorIsOk && step.errorIsOk(errText)) {
    ({ verdict, note } = step.grade(r));
  } else if (r.error) { verdict = 'FAIL'; note = `transport/RPC error: ${r.error}`; }
  else if (r.isError) { verdict = 'FAIL'; note = `tool error: ${preview(r.text)}`; }
  else {
    try { ({ verdict, note } = step.grade(r)); } catch (e) { verdict = 'FAIL'; note = `grade threw: ${e.message}`; }
    if (verdict === 'PASS' && r.ms > SLOW_MS) { verdict = 'WARN'; note = `slow ${r.ms}ms — ${note}`; }
    if (step.capture) try { step.capture(r); } catch { /* best effort */ }
  }
  counts[verdict]++;
  const icon = { PASS: '✅', WARN: '⚠️ ', FAIL: '❌' }[verdict];
  console.log(`  ${icon} ${verdict.padEnd(4)} ${label.padEnd(42)} ${String(r.ms).padStart(5)}ms  ${note}`);
  log.push({ tool: label, args, verdict, note, ms: r.ms, responseSize: r.data?.responseSize ?? null, preview: preview(r.text) });
}

console.log(`\n── Summary: ${counts.PASS} PASS · ${counts.WARN} WARN · ${counts.FAIL} FAIL · ${counts.SKIP} SKIP ──`);
fs.writeFileSync(OUT, JSON.stringify({ server: SERVER, ran: new Date().toISOString(), counts, results: log }, null, 2));
console.log(`Full results + previews → ${OUT}\n`);

process.exit(counts.FAIL > 0 ? 1 : 0);
