/** Run against a production preview. Keep benchmarks separate from builds/E2E. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const base = process.env.PERF_URL || 'http://127.0.0.1:4173';
  const label = process.env.PERF_LABEL || 'performance';
  const edition = process.env.PERF_EDITION || '2025';
  const cpu = Number(process.env.PERF_CPU || 4);
  const seed = Number(process.env.PERF_SEED || 12345);
  const downloadMbps = Number(process.env.PERF_DOWNLOAD_MBPS || 0);
  const latencyMs = Number(process.env.PERF_LATENCY_MS || 0);
  const trace = process.env.PERF_TRACE === '1';
  if (![cpu, seed, downloadMbps, latencyMs].every(Number.isFinite) || cpu < 1 || cpu > 20 || downloadMbps < 0 || latencyMs < 0) throw new Error('Invalid performance profile');
  if (!/^[A-Za-z0-9_-]+$/.test(label)) throw new Error('PERF_LABEL must contain only letters, numbers, underscores or hyphens');
  const outputRoot = process.env.PERF_OUTPUT || os.tmpdir();
  fs.mkdirSync(outputRoot, { recursive: true, mode: 0o700 });
  // A private, unpredictable directory prevents another local user pre-creating
  // report files or replacing predictable paths with symlinks.
  const output = fs.mkdtempSync(path.join(outputRoot, 'wrapped-performance-'));
  console.log(`Performance artifacts: ${output}`);
  const browser = await chromium.launch({ channel: process.env.PERF_CHANNEL === 'chromium' ? undefined : process.env.PERF_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (downloadMbps || latencyMs) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: latencyMs, downloadThroughput: downloadMbps ? downloadMbps * 1_000_000 / 8 : -1, uploadThroughput: -1 });
  if (trace) await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8.execute,disabled-by-default-devtools.timeline.frame', transferMode: 'ReturnAsStream' });
  let buildInfo = null;
  try { const response = await context.request.get(`${base}/build-info.json`); if (response.ok()) { const data = await response.json(); if (data.dependencyFingerprint) buildInfo = data; } } catch { /* An older deployment may not expose provenance yet. */ }
  const networkResources = [];
  const pendingNetwork = [];
  page.on('requestfinished', request => {
    if (!new URL(request.url()).pathname.startsWith('/data/')) return;
    pendingNetwork.push((async () => {
      const sizes = await request.sizes();
      const timing = request.timing();
      networkResources.push({ path: new URL(request.url()).pathname, encodedBytes: sizes.responseBodySize, headerBytes: sizes.responseHeadersSize, durationMs: timing.responseEnd - timing.requestStart });
    })().catch(() => {}));
  });
  const errors = [];
  const results = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(seed => {
    let state = seed >>> 0;
    Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    window.__WRAPPED_PERFORMANCE__ = true;
    window.__speechMeasures = [];
    new PerformanceObserver(list => window.__speechMeasures.push(...list.getEntries().filter(entry => entry.name.startsWith('wrapped:')).map(entry => ({ name: entry.name, duration: entry.duration, detail: entry.detail }))))
      .observe({ type: 'measure', buffered: true });
    window.__frames = [];
    window.__longtasks = [];
    let last;
    requestAnimationFrame(function tick(t) {
      if (last) window.__frames.push({ t, dt: t - last });
      last = t;
      requestAnimationFrame(tick);
    });
    new PerformanceObserver(list => list.getEntries().forEach(entry => window.__longtasks.push({ start: entry.startTime, duration: entry.duration })))
      .observe({ type: 'longtask', buffered: true });
  }, seed);
  async function sample(name, action, wait = 1500) {
    const start = await page.evaluate(() => performance.now());
    const actionStarted = Date.now();
    await action();
    const actionMs = Date.now() - actionStarted;
    await page.waitForTimeout(wait);
    const data = await page.evaluate(start => {
      const frames = window.__frames.filter(frame => frame.t - frame.dt >= start).map(frame => frame.dt).sort((a, b) => a - b);
      const animations = document.getAnimations().filter(animation => animation.playState === 'running');
      return {
        p95: frames[Math.floor(frames.length * .95)], p99: frames[Math.floor(frames.length * .99)], max: frames.at(-1), frames: frames.length,
        gapsOver25: frames.filter(frame => frame > 25).length,
        longtasks: window.__longtasks.filter(task => task.start >= start),
        dom: document.querySelectorAll('*').length,
        runningAnimations: animations.length,
        offscreenAnimations: animations.filter(animation => {
          const bounds = animation.effect?.target?.getBoundingClientRect();
          return bounds && (bounds.bottom < 0 || bounds.top > innerHeight);
        }).length,
        speechMeasures: window.__speechMeasures.splice(0),
        sections: document.querySelectorAll('[data-slide-id]').length,
        mounted: document.querySelectorAll('[data-slide-mounted="true"]').length,
      };
    }, start);
    results.push({ name, actionMs, ...data });
    console.log(label, name, JSON.stringify(data));
  }
  try {
    await page.goto(`${base}/${edition}`);
    await page.getByRole('button', { name: 'Starten', exact: true }).waitFor();
    await page.waitForTimeout(1000);
    await sample('intro-idle', async () => {});
    await sample('intro-start', () => page.getByRole('button', { name: 'Starten', exact: true }).click(), 1200);
    for (const id of ['reveal-topics', 'chart-speeches', 'reveal-tone']) {
      await sample(id, () => page.locator(`[data-slide-id="${id}"]`).evaluate(section => {
        section.parentElement.scrollTo({ top: section.offsetTop, behavior: 'instant' });
      }));
    }
    await page.goto(`${base}/${edition}/suche?q=Klima`, { waitUntil: 'commit' });
    const searchReady = async () => {
      await page.waitForFunction(() => {
        const results = document.querySelector('#search-results');
        return results && results.getAttribute('aria-busy') === 'false' && results.innerText.includes('gefunden');
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    await sample('search-cold', searchReady, 300);
    await page.waitForTimeout(800);
    await sample('search-typing', async () => {
      const input = page.locator('input[type="text"]').first();
      await input.fill('');
      await input.pressSequentially('Deutschland', { delay: 70 });
      await page.waitForURL(url => url.searchParams.get('q') === 'Deutschland');
      await searchReady();
    }, 1800);
    for (let i = 0; i < 3; i++) {
      await sample(`search-page-${i + 2}`, async () => {
        await page.getByRole('button', { name: /Mehr laden|Weitere Ergebnisse/ }).evaluate(button => button.click());
        await page.waitForFunction(page => document.querySelector('#search-results')?.textContent.includes(`Seite ${page} von`), i + 2);
        await searchReady();
      }, 1000);
    }
    await page.screenshot({ path: path.join(output, `${label}.png`) });
  } finally {
    if (trace) {
      const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
      await cdp.send('Tracing.end');
      const { stream } = await complete;
      const chunks = [];
      for (;;) { const chunk = await cdp.send('IO.read', { handle: stream }); chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8')); if (chunk.eof) break; }
      await cdp.send('IO.close', { handle: stream });
      fs.writeFileSync(path.join(output, `${label}-trace.json`), Buffer.concat(chunks), { flag: 'wx', mode: 0o600 });
    }
    await Promise.all(pendingNetwork);
    fs.writeFileSync(path.join(output, `${label}.json`), JSON.stringify({
      browser: browser.version(), cpu, viewport: '390x844 DPR3', headless: true, serviceWorkers: 'blocked',
      edition, base, seed, network: { downloadMbps, latencyMs }, trace, buildInfo,
      host: { platform: os.platform(), architecture: os.arch(), cpu: os.cpus()[0]?.model, cores: os.cpus().length },
      results, errors, networkResources,
    }, null, 2), { flag: 'wx', mode: 0o600 });
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
