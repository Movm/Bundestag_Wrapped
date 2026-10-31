import { expect, test } from 'playwright/test';
import { installEditionFixtures } from './fixtures';

test.beforeEach(async ({ page }) => { await installEditionFixtures(page); });

test('does not fetch the speech corpus before a search is requested', async ({ page, context }) => {
  const speechRequests: string[] = [];
  context.on('request', request => { if (request.url().endsWith('/speeches.json') || /\/search-v[0-9]+-/.test(request.url())) speechRequests.push(request.url()); });
  await page.goto('/2025/suche');
  await expect(page.getByRole('textbox', { name: 'Suche nach Themen, Redner:innen oder Parteien' })).toBeVisible();
  await page.waitForTimeout(500);
  expect(speechRequests).toEqual([]);
});

test('searches in the worker, bounds every page and loads full text on demand', async ({ page }) => {
  const speeches = Array.from({ length: 140 }, (_, id) => ({ speaker: `Person ${id}`, party: 'Partei Alpha', category: 'rede', words: 400,
    text: `Klima Energie Beitrag ${id}. ` + 'Kontext '.repeat(100) + 'Volltext-Ende' }));
  await page.route('**/data/fixtures/2025/speeches.json', route => route.fulfill({ json: { speeches } }));
  await page.goto('/2025/suche?q=Klima');
  const results = page.locator('#search-results');
  await expect(results).toHaveAttribute('aria-busy', 'false');
  await expect(results).toContainText('140 Reden gefunden');
  const cards = results.locator('button.group');
  await expect(cards).toHaveCount(50);
  await page.getByRole('button', { name: /Weitere Ergebnisse/ }).click();
  await expect(results).toContainText('Seite 2 von 3');
  await expect(cards).toHaveCount(50);
  await expect(cards.first()).toContainText('Person 50');
  await cards.first().click();
  await expect(page.getByRole('dialog')).toContainText('Volltext-Ende');
  await page.getByRole('button', { name: 'Dialog schließen' }).click();
  await page.getByRole('button', { name: 'Vorherige Ergebnisse' }).click();
  await expect(results).toContainText('Seite 1 von 3');
  await expect(cards).toHaveCount(50);
  const input = page.getByRole('textbox', { name: 'Suche nach Reden, Abgeordneten oder Wörtern' });
  await input.fill('Unauffindbar');
  await page.waitForTimeout(350);
  await input.fill('Energie');
  await expect(results).toContainText('140 Reden gefunden');
  await expect(page).toHaveURL(/q=Energie/);
  await expect(cards).toHaveCount(50);
});

test('keeps snap sections but activates only the current slide and neighbours', async ({ page }) => {
  await page.goto('/2025');
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeVisible();
  expect(await page.locator('[data-slide-id]').count()).toBeGreaterThan(20);
  expect(await page.locator('[data-slide-mounted="true"]').count()).toBeLessThanOrEqual(3);
  const target = page.locator('[data-slide-id="reveal-topics"]');
  await target.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await expect(target).toHaveAttribute('data-slide-active', 'true');
  await expect(page.locator('[data-slide-id="intro"]')).toHaveAttribute('data-slide-active', 'false');
  await expect.poll(() => page.locator('[data-slide-id="intro"]').evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
});

test('does not let an old quiz overlay pull the reader back after navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/2025');
  await page.getByRole('button', { name: 'Starten', exact: true }).click();
  const quiz = page.locator('[data-slide-id="quiz-topics"]');
  await quiz.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  const answer = quiz.getByRole('button').first();
  await answer.click();
  await expect(answer).toBeDisabled();
  const target = page.locator('[data-slide-id="reveal-drama"]');
  await target.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await expect(target).toHaveAttribute('data-slide-active', 'true');
  await page.waitForTimeout(2800);
  await expect(target).toHaveAttribute('data-slide-active', 'true');
});


test('cancels an intro launch when navigating away and permits starting again', async ({ page }) => {
  await page.goto('/2025');
  const intro = page.locator('[data-slide-id="intro"]');
  await intro.getByRole('button', { name: 'Starten', exact: true }).click();
  const target = page.locator('[data-slide-id="reveal-drama"]');
  await target.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await expect(target).toHaveAttribute('data-slide-effects-active', 'true');
  await page.waitForTimeout(1600);
  await expect(target).toHaveAttribute('data-slide-effects-active', 'true');
  await intro.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await expect(intro).toHaveAttribute('data-slide-effects-active', 'true');
  await expect(intro.getByRole('button', { name: 'Starten', exact: true })).toBeEnabled();
});

test('pauses offscreen decoration in reading mode while retaining all slide content', async ({ page }) => {
  await installEditionFixtures(page, { includeMoinSpeakers: true });
  await page.goto('/2025');
  await page.getByRole('checkbox', { name: /Lesemodus/ }).check();
  const target = page.locator('[data-slide-id="reveal-topics"]');
  await target.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await expect(target).toHaveAttribute('data-slide-effects-active', 'true');
  await expect(page.locator('[data-slide-effects-active="true"]')).toHaveCount(1);
  await page.waitForTimeout(2500);
  await expect(page.locator('#reveal-moin')).toContainText('Alex Alpha');
  const offscreenLoops = await page.locator('[data-slide-effects-active="false"]').evaluateAll(sections =>
    sections.flatMap(section => section.getAnimations({ subtree: true })).filter(animation =>
      animation.playState === 'running' && animation.effect?.getTiming().iterations === Infinity,
    ).length,
  );
  expect(offscreenLoops).toBe(0);
  await expect(page.locator('[data-slide-id="intro"] h1')).toContainText('BUNDESTAG');
});


test('pauses offscreen speaker-share confetti in reading mode', async ({ page }) => {
  await page.goto('/2025/wrapped/shared-speaker');
  await page.getByRole('checkbox', { name: /Lesemodus/ }).check();
  const share = page.locator('#speaker-share');
  await expect(share).toHaveAttribute('data-slide-effects-active', 'false');
  await page.waitForTimeout(2500);
  const running = await share.evaluate(section => section.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length);
  expect(running).toBe(0);
});

test('reveals a distant scroll destination in the same commit that selects it', async ({ page }) => {
  await page.goto('/2025');
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const blanks: string[] = [];
    Object.assign(window, { __blankSelectedSlides: blanks });
    const root = document.querySelector('[data-story-scroll]')!;
    new MutationObserver(() => {
      const selected = root.querySelector<HTMLElement>('[data-slide-effects-active="true"]');
      if (selected && !selected.innerText.trim()) blanks.push(selected.id);
    }).observe(root, { attributes: true, subtree: true, childList: true, attributeFilter: ['data-slide-effects-active', 'style'] });
  });
  await page.locator('[data-slide-id="finale"]').evaluate(section => section.parentElement!.scrollTo({ top: section.offsetTop, behavior: 'instant' }));
  await expect(page.locator('[data-slide-id="finale"]')).toHaveAttribute('data-slide-effects-active', 'true');
  await expect(page.locator('[data-slide-id="finale"]')).toContainText('Bundestag Wrapped');
  expect(await page.evaluate(() => Reflect.get(window, '__blankSelectedSlides'))).toEqual([]);
});

test('retains the height of tall visited content when its effects are suspended', async ({ page }) => {
  await page.goto('/2025');
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeVisible();
  await page.addStyleTag({ content: '[data-slide-id="info-disclaimer"] > * { min-height: 1600px !important; }' });
  const tall = page.locator('[data-slide-id="info-disclaimer"]');
  await tall.evaluate(section => section.parentElement!.scrollTo({ top: section.offsetTop, behavior: 'instant' }));
  await expect(tall).toHaveAttribute('data-slide-effects-active', 'true');
  await expect.poll(() => tall.evaluate(section => section.getBoundingClientRect().height)).toBeGreaterThan(1600);
  const height = await tall.evaluate(section => section.getBoundingClientRect().height);
  await page.locator('[data-slide-id="reveal-topics"]').evaluate(section => section.parentElement!.scrollTo({ top: section.offsetTop, behavior: 'instant' }));
  await expect(tall).toHaveAttribute('data-slide-active', 'false');
  await expect.poll(() => tall.evaluate(section => section.getBoundingClientRect().height)).toBeCloseTo(height, 0);
});

test('keeps selection aligned with the viewport after content reflows without scrolling', async ({ page }) => {
  await page.goto('/2025');
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeVisible();
  await page.addStyleTag({ content: '[data-story-scroll] { overflow-anchor: none; }' });
  await page.locator('[data-slide-id="reveal-topics"]').evaluate(section => section.parentElement!.scrollTo({ top: section.offsetTop, behavior: 'instant' }));
  await expect(page.locator('[data-slide-id="reveal-topics"]')).toHaveAttribute('data-slide-effects-active', 'true');
  await page.addStyleTag({ content: '[data-slide-id="info-disclaimer"] { min-height: 3000px !important; }' });
  await expect.poll(() => page.evaluate(() => {
    const root = document.querySelector('[data-story-scroll]')!;
    const viewport = root.getBoundingClientRect(), anchor = viewport.top + viewport.height / 2;
    const actual = [...root.querySelectorAll<HTMLElement>('[data-slide-id]')].find(section => {
      const rect = section.getBoundingClientRect(); return rect.top <= anchor && rect.bottom > anchor;
    });
    return actual?.getAttribute('data-slide-effects-active');
  })).toBe('true');
});
