import { expect, test, type Page } from 'playwright/test';
import { createServer, request as httpRequest, type Server } from 'node:http';
import { Buffer } from 'node:buffer';
import { installEditionFixtures } from './fixtures';
import { encodePostings, gramFilename } from '../src/lib/speech-index-format';

const manifestSha = 'a'.repeat(64), sourceSha = 'b'.repeat(64);
const base = `/data/fixtures/search-v1-${manifestSha}-${sourceSha}`;
const speeches = Array.from({ length: 140 }, (_, id) => ({ speaker: `Person ${id}`, party: 'Partei Alpha', type: 'rede', category: 'rede', words: 400,
  text: `Klima Energie Beitrag ${id}. ς µμ. ` + 'Kontext '.repeat(100) + 'Volltext-Ende' }));
const grams = new Map<string, number[]>();
let offset = 0;
for (const speech of speeches) {
  const text = speech.text.toLowerCase();
  for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= text.length; i++) {
    const gram = text.slice(i, i + n), positions = grams.get(gram) ?? [];
    positions.push(offset + i); grams.set(gram, positions);
  }
  offset += text.length + 1;
}
const index = { version: 1, editionId: '2025', dataVersion: 'fixture-a', manifestSha256: manifestSha, sourceSha256: sourceSha,
  speakers: speeches.map(s => s.speaker), parties: ['Partei Alpha'], types: ['rede'],
  rows: speeches.map((s, id) => [id, 0, 0, 0, s.words, s.text.toLowerCase().length, s.text.length]), grams: [...grams].map(([gram, values]) => [gram, values.length]) };
const files = new Map([...grams].map(([gram, positions]) => [gramFilename(gram), Buffer.from(encodePostings(positions))]));
const textBytes = Buffer.from(speeches.map(s => s.text).join(''), 'utf16le');
// WebKit's intercepted-response MIME handling drops multipart parameters.
// Serve the binary over real HTTP so every browser tests the actual transport.
let rangeServer: Server, rangeOrigin: string;
test.beforeAll(async ({ baseURL }) => {
  rangeServer = createServer((request, response) => {
    if (!request.url?.endsWith('/texts.bin')) {
      const target = new URL(String(baseURL));
      const resource = new URL(request.url ?? '/', 'http://fixture.invalid');
      target.pathname = resource.pathname; target.search = resource.search;
      const upstream = httpRequest(target, { method: request.method, headers: { ...request.headers, host: target.host } }, incoming => {
        response.writeHead(incoming.statusCode ?? 502, incoming.headers); incoming.pipe(response);
      });
      upstream.on('error', () => { response.writeHead(502); response.end(); });
      request.pipe(upstream); return;
    }
    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('access-control-allow-headers', 'range');
    response.setHeader('access-control-expose-headers', 'content-type, content-range, content-length');
    if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
    const ranges = (request.headers.range ?? '').slice(6).split(',').map(range => range.split('-').map(Number));
    const parts = ranges.flatMap(([start, end]) => [Buffer.from(`\r\n--fixture\r\nContent-Range: bytes ${start}-${end}/${textBytes.length}\r\n\r\n`), textBytes.subarray(start, end + 1)]);
    parts.push(Buffer.from('\r\n--fixture--\r\n'));
    response.writeHead(206, { 'content-type': 'multipart/byteranges; boundary=fixture', 'access-control-allow-origin': '*' });
    response.end(Buffer.concat(parts));
  });
  await new Promise<void>(resolve => rangeServer.listen(0, '127.0.0.1', resolve));
  const address = rangeServer.address();
  if (!address || typeof address === 'string') throw new Error('Missing fixture server address');
  rangeOrigin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await new Promise<void>((resolve, reject) => rangeServer.close(error => error ? reject(error) : resolve())); });
async function installIndex(page: Page, { ignoreRanges = false, firstRangeGate }: { ignoreRanges?: boolean; firstRangeGate?: () => Promise<void> } = {}) {
  await installEditionFixtures(page);
  let first = true;
  await page.route('**/data/**', async route => {
    const resource = new URL(route.request().url()).pathname;
    if (resource === '/data/fixtures/2025/checksums.json') return route.fulfill({ json: { 'manifest.json': manifestSha, 'speeches.json': sourceSha } });
    if (resource === '/data/fixtures/2025/speeches.json') return route.fulfill({ json: { speeches } });
    if (resource === `${base}/index.json`) return route.fulfill({ json: index });
    if (resource.startsWith(`${base}/grams/`)) {
      const body = files.get(resource.slice(`${base}/grams/`.length));
      return body ? route.fulfill({ contentType: 'application/octet-stream', body }) : route.fulfill({ status: 404 });
    }
    const detail = new RegExp(`^${base}/details/([0-9]+)\\.json$`).exec(resource);
    if (detail) { const id = Number(detail[1]); return route.fulfill({ json: { ...speeches[id], id } }); }
    if (resource === `${base}/texts.bin`) {
      if (first && firstRangeGate) { first = false; await firstRangeGate(); }
      if (route.request().failure()) return;
      if (ignoreRanges) return route.fulfill({ status: 200, body: 'range disabled' });
      const value = route.request().headers().range;
      expect(value).toMatch(/^bytes=/);
      const ranges = value.slice(6).split(',').map(range => range.split('-').map(Number));
      expect(ranges.length).toBeLessThanOrEqual(50);
      return route.continue();
    }
    return route.fallback();
  });
}

test('uses bounded index previews, pages and full details without loading the corpus', async ({ page, context }) => {
  await installIndex(page);
  const requests: string[] = [], rangeStatuses: number[] = [];
  context.on('request', request => requests.push(new URL(request.url()).pathname));
  context.on('response', response => { if (response.url().endsWith('/texts.bin')) rangeStatuses.push(response.status()); });
  await page.goto(`${rangeOrigin}/2025/suche?q=Klima`);
  const panel = page.locator('#search-results'), cards = panel.locator('button.group');
  await expect(panel).toContainText('140 Reden gefunden');
  await expect(cards).toHaveCount(50);
  await expect(cards.first()).toContainText('Person 0');
  expect(requests.filter(url => url.endsWith('/texts.bin'))).toHaveLength(1);
  expect(requests.filter(url => url.includes('/details/'))).toHaveLength(0);
  await cards.first().click();
  await expect(page.getByRole('dialog')).toContainText('Volltext-Ende');
  expect(requests.filter(url => url.includes('/details/'))).toHaveLength(1);
  await page.getByRole('button', { name: 'Dialog schließen' }).click();
  await page.getByRole('button', { name: /Weitere Ergebnisse/ }).click();
  await expect(panel).toContainText('Seite 2 von 3');
  await expect(cards).toHaveCount(50);
  await expect(cards.first()).toContainText('Person 50');
  await page.getByRole('textbox', { name: 'Suche nach Reden, Abgeordneten oder Wörtern' }).fill('σ OR absent');
  await expect(panel).toContainText('140 Reden gefunden');
  await expect(page).toHaveURL(/q=%CF%83/);
  await expect(panel).toHaveAttribute('aria-busy', 'false');
  await expect(panel).toContainText('140 Reden gefunden');
  expect(requests.some(url => url.endsWith('/speeches.json'))).toBe(false);
  expect(rangeStatuses.length).toBeGreaterThan(0);
  expect(rangeStatuses.every(status => status === 206)).toBe(true);
});

test('keeps the newest query when an earlier range response is delayed', async ({ page }) => {
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const waiting = new Promise<void>(resolve => { started = resolve; });
  let indexRequests = 0;
  page.context().on('request', request => { if (request.url().endsWith('/index.json') && request.url().includes('/search-v1-')) indexRequests++; });
  await installIndex(page, { firstRangeGate: async () => { started(); await gate; } });
  try {
    await page.goto(`${rangeOrigin}/2025/suche?q=Klima`);
    await waiting;
    await page.locator('input[type="text"]').first().fill('AbsentUnique');
    await expect(page).toHaveURL(/q=AbsentUnique/);
    await expect(page.locator('#search-results')).toHaveAttribute('aria-busy', 'false');
    release();
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(/q=AbsentUnique/);
    await expect(page.locator('#search-results button.group')).toHaveCount(0);
    await expect(page.locator('#search-results')).not.toContainText('Fehler');
    await page.locator('input[type="text"]').first().fill('Energie');
    await expect(page).toHaveURL(/q=Energie/);
    await expect(page.locator('#search-results')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#search-results')).toContainText('140 Reden gefunden');
    expect(indexRequests).toBe(1);
  } finally { release(); }
});

test('uses the compatible full-text backend when the origin ignores ranges', async ({ page, context }) => {
  await installIndex(page, { ignoreRanges: true });
  const corpusRequests: string[] = [];
  context.on('request', request => { if (request.url().endsWith('/speeches.json')) corpusRequests.push(request.url()); });
  await page.goto(`${rangeOrigin}/2025/suche?q=Klima`);
  await expect(page.locator('#search-results')).toContainText('140 Reden gefunden');
  await expect(page.locator('#search-results button.group')).toHaveCount(50);
  expect(corpusRequests).toHaveLength(1);
});
