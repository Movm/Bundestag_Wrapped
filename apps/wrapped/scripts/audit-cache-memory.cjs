/** Production-only PWA/worker diagnostic. Heap samples cover the main renderer, not worker RAM. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const { expect: baseExpect } = require('playwright/test');
const expect = baseExpect.configure({ timeout: 20000 });

(async () => {
  const base = (process.env.PERF_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP(S) origin without credentials');
  const cycles = Number(process.env.PERF_CYCLES || 30);
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > 100) throw new Error('PERF_CYCLES must be 1–100');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapped-cache-memory-'));
  const report = { base, cycles, time: new Date().toISOString(), viewport: { width: 390, height: 844 },
    profile: { cpu: 1, network: 'unthrottled', serviceWorkers: 'allow', heapScope: 'main renderer after GC' },
    host: { platform: os.platform(), architecture: os.arch(), cpu: os.cpus()[0]?.model }, browser: null, buildInfo: null, workersCreated: 0, samples: [], caches: {}, corpusRequests: [], errors: [], status: 'running' };
  console.log(`Cache/memory artifacts: ${output}`);
  const browser = await chromium.launch({ channel: process.env.PERF_CHANNEL === 'chromium' ? undefined : process.env.PERF_CHANNEL || 'chrome' });
  try {
    report.browser = browser.version();
    const context = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 390, height: 844 } });
    context.on('request', request => { const pathname = new URL(request.url()).pathname; if (/\/speeches(?:_db)?\.json$/.test(pathname)) report.corpusRequests.push(pathname); });
    const page = await context.newPage();
    page.on('worker', () => report.workersCreated++);
    page.on('pageerror', error => report.errors.push(error.message));
    const info = await context.request.get(`${base}/build-info.json`);
    if (info.ok()) report.buildInfo = await info.json();
    await page.goto(`${base}/2025`);
    await page.getByRole('button', { name: 'Starten', exact: true }).waitFor();
    await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.active));
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.goto(`${base}/2025/suche?q=Klima`);
    const panel = page.locator('#search-results'), cards = panel.locator('button.group');
    await expect(cards).toHaveCount(50);
    await cards.first().click();
    const fullText = page.getByRole('dialog').locator('p.whitespace-pre-wrap');
    await expect(fullText).not.toHaveText('Rede wird geladen…');
    await expect(fullText).not.toHaveText('Rede konnte nicht geladen werden.');
    await page.keyboard.press('Escape');
    const session = await context.newCDPSession(page);
    for (let cycle = 0; cycle < cycles; cycle++) {
      await page.getByRole('tab', { name: 'Wörter', exact: true }).click();
      await expect.poll(() => page.workers().length).toBe(0);
      await session.send('HeapProfiler.collectGarbage');
      report.samples.push({ cycle, workers: page.workers().length,
        heap: await session.send('Runtime.getHeapUsage'), dom: await session.send('Memory.getDOMCounters') });
      await page.getByRole('tab', { name: 'Reden', exact: true }).click();
      await expect.poll(() => page.workers().length).toBe(1);
      await expect(panel).toHaveAttribute('aria-busy', 'false');
      await expect(cards).toHaveCount(50);
    }
    report.caches = await page.evaluate(async () => {
      const result = {};
      for (const name of await caches.keys()) result[name] = (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname);
      return result;
    });
    const resources = Object.values(report.caches).flat();
    assert(resources.some(resource => resource.includes('/search-v') && resource.endsWith('/index.json')), 'Missing cached index');
    assert(resources.some(resource => resource.includes('/grams/')), 'Missing cached postings');
    assert(resources.some(resource => resource.includes('/details/')), 'Missing cached full-text detail');
    assert.deepEqual(report.corpusRequests, [], 'Unexpected legacy corpus fallback');
    assert(!resources.some(resource => resource.endsWith('/texts.bin')), 'Unbounded text source entered cache');
    assert(!resources.some(resource => resource.startsWith('/data/2026/')), 'Protected preview entered public cache');
    assert.deepEqual(report.errors, []);
    report.status = 'passed';
    console.log(JSON.stringify({ status: report.status, workersCreated: report.workersCreated,
      heapBytes: report.samples.map(sample => sample.heap.usedSize), domNodes: report.samples.map(sample => sample.dom.nodes),
      cacheEntries: Object.fromEntries(Object.entries(report.caches).map(([name, resources]) => [name, resources.length])) }, null, 2));
  } catch (error) { report.status = 'failed'; report.failure = error.message; throw error; }
  finally {
    fs.writeFileSync(path.join(output, 'cache-memory.json'), JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
