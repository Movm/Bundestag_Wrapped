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
  if (!/^[A-Za-z0-9_-]+$/.test(label)) throw new Error('PERF_LABEL must contain only letters, numbers, underscores or hyphens');
  const outputRoot = process.env.PERF_OUTPUT || os.tmpdir();
  fs.mkdirSync(outputRoot, { recursive: true, mode: 0o700 });
  // A private, unpredictable directory prevents another local user pre-creating
  // report files or replacing predictable paths with symlinks.
  const output = fs.mkdtempSync(path.join(outputRoot, 'wrapped-performance-'));
  console.log(`Performance artifacts: ${output}`);
  const browser = await chromium.launch({ channel: process.env.PERF_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const errors = [];
  const results = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
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
  });
  async function sample(name, action, wait = 1500) {
    const start = await page.evaluate(() => performance.now());
    await action();
    await page.waitForTimeout(wait);
    const data = await page.evaluate(start => {
      const frames = window.__frames.filter(frame => frame.t - frame.dt >= start).map(frame => frame.dt).sort((a, b) => a - b);
      const animations = document.getAnimations().filter(animation => animation.playState === 'running');
      return {
        p95: frames[Math.floor(frames.length * .95)], max: frames.at(-1), frames: frames.length,
        gapsOver25: frames.filter(frame => frame > 25).length,
        longtasks: window.__longtasks.filter(task => task.start >= start),
        dom: document.querySelectorAll('*').length,
        runningAnimations: animations.length,
        offscreenAnimations: animations.filter(animation => {
          const bounds = animation.effect?.target?.getBoundingClientRect();
          return bounds && (bounds.bottom < 0 || bounds.top > innerHeight);
        }).length,
        sections: document.querySelectorAll('[data-slide-id]').length,
        mounted: document.querySelectorAll('[data-slide-mounted="true"]').length,
      };
    }, start);
    results.push({ name, ...data });
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
    await page.goto(`${base}/${edition}/suche?q=Klima`);
    await page.waitForFunction(() => {
      const results = document.querySelector('#search-results');
      return results && results.getAttribute('aria-busy') !== 'true' && results.innerText.includes('gefunden');
    });
    await page.waitForTimeout(800);
    await sample('search-typing', async () => {
      const input = page.locator('input[type="text"]').first();
      await input.fill('');
      await input.pressSequentially('Deutschland', { delay: 70 });
    }, 1800);
    for (let i = 0; i < 3; i++) {
      await sample(`search-page-${i + 2}`, () => page.getByRole('button', { name: /Mehr laden|Weitere Ergebnisse/ }).evaluate(button => button.click()), 1000);
    }
    await page.screenshot({ path: path.join(output, `${label}.png`) });
  } finally {
    fs.writeFileSync(path.join(output, `${label}.json`), JSON.stringify({
      browser: browser.version(), cpu, viewport: '390x844 DPR3', headless: true, serviceWorkers: 'blocked',
      edition, base, results, errors,
    }, null, 2), { flag: 'wx', mode: 0o600 });
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
