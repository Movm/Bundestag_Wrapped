/** Verify generated sidecars against the existing full-text search, without UI changes. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { canonicalizeRegexTerm, decodePostings, gramFilename, queryGrams, SPEECH_INDEX_VERSION } from '../src/lib/speech-index-format.ts';
import { textFromParts } from '../src/lib/speech-text-ranges.ts';
import { matchIndexedTerm, parseStaticSpeechIndex } from '../src/lib/speech-index-model.ts';
import { findBestSnippet, hasSearchContent, parseSearchQuery, searchSpeeches, sortSpeeches } from '../src/lib/search-utils.ts';

const dataRoot = path.resolve(process.argv[2] || fileURLToPath(new URL('../dist/data', import.meta.url)));
const output = process.argv[3] || path.join(mkdtempSync(path.join(tmpdir(), 'wrapped-search-parity-')), 'parity.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const registry = JSON.parse(readFileSync(path.join(dataRoot, 'editions.json')));
const queries = ['', 'Klima', 'Deutschland', 'Haushalt', 'Klima AND Energie NOT Atomkraft', 'Migration OR Bildung', '"soziale Sicherheit"', '"die Bundesregierung"', '"Klima" "Europa"', 'NOT Atomkraft', 'a', 'en', 'und', 'aa', 'ä', 'ß', 'İ', '😀', 'σ OR ς', 'µ OR μ', 'e-mail', '§', '2025', 'speaker:Merz', 'party:SPD words:>100', 'speaker:Scholz Klima OR Deutschland', 'words:<100', 'Nichtvorhandenxyz'];
const reports = [];
for (const edition of registry.editions) {
  const manifestFile = path.join(dataRoot, edition.manifestUrl.slice('/data/'.length));
  const manifestBytes = readFileSync(manifestFile), manifest = JSON.parse(manifestBytes);
  const sourceBytes = readFileSync(path.join(path.dirname(manifestFile), manifest.assets.speeches));
  const corpus = JSON.parse(sourceBytes).speeches.map((speech, id) => ({ ...speech, id }));
  const identity = { editionId: edition.id, dataVersion: manifest.dataVersion, manifestSha256: hash(manifestBytes), sourceSha256: hash(sourceBytes) };
  const directory = path.join(path.dirname(path.dirname(manifestFile)), `search-v${SPEECH_INDEX_VERSION}-${identity.manifestSha256}-${identity.sourceSha256}`);
  const index = parseStaticSpeechIndex(JSON.parse(readFileSync(path.join(directory, 'index.json'))), identity);
  const textBytes = readFileSync(path.join(directory, 'texts.bin'));
  assert.equal(textBytes.length, index.textLength * 2);
  const lists = new Map(), canonicalLists = new Map(), matches = new Map();
  function posting(gram) {
    if (!lists.has(gram)) {
      const bytes = Uint8Array.from(readFileSync(path.join(directory, 'grams', gramFilename(gram))));
      const list = decodePostings(bytes.buffer, index.end - 1);
      assert.equal(list.positions.length, index.counts.get(gram));
      lists.set(gram, list);
    }
    return lists.get(gram);
  }
  function canonicalPosting(gram) {
    if (!canonicalLists.has(gram)) {
      const variants = (index.aliases.get(gram) || []).map(posting);
      const positions = new Uint32Array(variants.reduce((sum, list) => sum + list.positions.length, 0));
      let offset = 0;
      for (const list of variants) { positions.set(list.positions, offset); offset += list.positions.length; }
      positions.sort();
      canonicalLists.set(gram, { positions });
    }
    return canonicalLists.get(gram);
  }
  function textMatches(term) {
    if (!matches.has(term)) {
      const normalParts = queryGrams(term), regexParts = queryGrams(canonicalizeRegexTerm(term));
      const contains = normalParts.some(part => !index.counts.has(part.gram)) ? new Map() : matchIndexedTerm(term, index, new Map(normalParts.map(part => [part.gram, posting(part.gram)])));
      const frequency = regexParts.some(part => !index.regexCounts.has(part.gram)) ? new Map() : matchIndexedTerm(term, index, new Map(regexParts.map(part => [part.gram, canonicalPosting(part.gram)])), true);
      matches.set(term, { contains, frequency });
    }
    return matches.get(term);
  }
  let cases = 0, snippets = 0;
  const started = performance.now();
  for (const query of queries) {
    const parsed = parseSearchQuery(query);
    for (const term of [...parsed.terms, ...parsed.phrases, ...parsed.notTerms]) textMatches(term);
    for (const filters of [{ party: '' }, { party: 'SPD' }, { party: '', minWords: 100, maxWords: 1500 }]) {
      const expected = searchSpeeches(corpus, parsed, filters);
      const actual = searchSpeeches(index.entries.map(entry => entry.speech), parsed, filters, (_, id) => ({
        contains: term => textMatches(term).contains.has(id),
        frequency: termIndex => textMatches(parsed.terms[termIndex]).frequency.get(id)?.frequency || 0,
      }));
      for (const sort of ['relevance', 'date', 'words-desc', 'words-asc', 'speaker']) {
        const a = sortSpeeches(actual, sort, hasSearchContent(parsed));
        const b = sortSpeeches(expected, sort, hasSearchContent(parsed));
        assert.deepEqual(a.map(speech => [speech.id, speech.score, speech._idx]), b.map(speech => [speech.id, speech.score, speech._idx]), `${edition.id}: ${query} ${sort} ${JSON.stringify(filters)}`);
        for (const speech of a.slice(0, 50)) {
          const doc = index.entries[speech.id];
          const terms = [...parsed.terms, ...parsed.phrases];
          const positions = terms.map(term => textMatches(term).contains.get(speech.id)?.first).filter(first => first !== undefined);
          const first = positions.length ? Math.min(...positions) : -1;
          const start = first < 0 ? 0 : Math.max(0, first - 50), end = Math.min(doc.length, start + 150);
          let snippet = '';
          if (start < doc.length) {
            snippet = textFromParts([{ start: 0, end: textBytes.length - 1, bytes: textBytes }], doc.originalStart + start, end - start);
          }
          if (start > 0) snippet = '...' + snippet;
          if (end < doc.length) snippet += '...';
          assert.equal(snippet, findBestSnippet(corpus[speech.id].text, terms, 150), `${edition.id}: snippet ${query} ${speech.id}`);
          snippets++;
        }
        cases++;
      }
    }
  }
  reports.push({ editionId: edition.id, speeches: corpus.length, cases, snippets, durationMs: performance.now() - started, status: 'passed' });
}
writeFileSync(output, JSON.stringify(reports, null, 2), { mode: 0o600, flag: 'wx' });
console.log(`Parity artifacts: ${output}`);
console.log(JSON.stringify(reports, null, 2));
