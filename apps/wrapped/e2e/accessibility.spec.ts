import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';
import { installEditionFixtures } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installEditionFixtures(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/data/fixtures/*/word_rankings.json', route => route.fulfill({ json: { parties: [] } }));
  await page.route('**/data/fixtures/*/words.json', route => route.fulfill({ json: { parties: [{ party: 'Partei Alpha', words: [{ word: 'Fixture', count: 4 }] }] } }));
});

test('keeps future slides out of Tab order, stops timed reading, and supports reading mode', async ({ page }) => {
  await page.goto('/2025');
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeVisible();
  await expect(page.locator('[data-slide-id="quiz-topics"]')).toHaveAttribute('inert', '');
  await expect(page.getByRole('heading', { name: 'Welches Thema dominiert den Bundestag?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Starten', exact: true }).click();
  const disclaimer = page.locator('#info-disclaimer');
  await expect(disclaimer).not.toHaveAttribute('inert', '');
  await expect(disclaimer).toBeFocused();
  // Regression for the previous four-second auto-advance timer.
  await page.waitForTimeout(4500);
  await expect(disclaimer).not.toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await expect(page.locator('#intro-topics')).toBeFocused();
  await page.getByRole('checkbox', { name: /Lesemodus/ }).check();
  await expect(page.locator('[data-slide-id][inert]')).toHaveCount(0);
  await page.getByRole('checkbox', { name: /Lesemodus/ }).uncheck();
  await expect(page.locator('[data-slide-id]:not([inert])')).toHaveCount(1);
});

test('provides persistent quiz feedback and keyboard-operable, single-activation flip cards', async ({ page }) => {
  await page.goto('/2025');
  await page.locator('#quiz-topics').evaluate(section => section.parentElement?.scrollTo({ top: section.offsetTop }));
  const quiz = page.locator('#quiz-topics');
  await expect(quiz).not.toHaveAttribute('inert', '');
  await quiz.getByRole('button').first().click();
  await expect(quiz.getByRole('status')).toContainText('Richtige Antwort:');
  await page.waitForTimeout(3000);
  await expect(quiz).not.toHaveAttribute('inert', '');
  await page.locator('#reveal-signature').evaluate(section => section.parentElement?.scrollTo({ top: section.offsetTop }));
  const card = page.locator('#reveal-signature').getByRole('button').first();
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Space');
  await expect(card).toHaveAttribute('aria-expanded', 'false');
  await card.click();
  await expect(card).toHaveAttribute('aria-expanded', 'true');
});

test('contains speech and menu focus and restores it on Escape', async ({ page }) => {
  await page.goto('/2025/suche?q=Fixture');
  const result = page.getByRole('button', { name: /Alex Ausgabe Eins.*Fixture-Rede/ });
  await result.click();
  const dialog = page.getByRole('dialog', { name: 'Alex Ausgabe Eins' });
  const close = dialog.getByRole('button', { name: 'Dialog schließen' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(result).toBeFocused();
  const menu = page.getByRole('button', { name: 'Menü öffnen' });
  await menu.click();
  await expect(page.getByRole('dialog', { name: 'Hauptnavigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});

test('operates search modes with arrow keys and announces member matches', async ({ page }) => {
  await page.goto('/2025/suche?q=Fixture');
  await page.getByRole('tab', { name: 'Reden', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  const speakers = page.getByRole('tab', { name: 'Abgeordnete', exact: true });
  await expect(speakers).toBeFocused();
  await expect(speakers).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Abgeordnete');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Wörter' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Fixture');
  await expect(page.getByRole('tab', { name: 'Wörter' })).toBeFocused();
  await page.goto('/2025/abgeordnete');
  await page.getByRole('textbox', { name: 'Abgeordneten suchen' }).fill('Alex');
  await expect(page.getByRole('status')).toContainText('1 Abgeordnete gefunden');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`reflows search, docs and tall story content at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ['/2025/suche?q=Fixture', '/2025/abgeordnete', '/2025/dokumentation', '/2025', '/2025/wrapped/shared-speaker']) {
      await page.goto(path);
      await expect(page.locator('#main-content')).toBeVisible();
      if (path.endsWith('/wrapped/shared-speaker')) await expect(page.getByRole('button', { name: "Los geht's" })).toBeVisible();
      if (path.endsWith('/dokumentation')) await expect(page.getByRole('heading', { name: /Klassifikation von/ })).toBeVisible();
      if (path.includes('/suche')) await expect(page.getByRole('tab', { name: 'Reden', exact: true })).toBeVisible();
      if (path.endsWith('/2025')) await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeVisible();
      const width = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(width.content, path).toBeLessThanOrEqual(width.viewport + 1);
      const sections = page.locator('[data-slide-id]');
      for (let i = 0; i < await sections.count(); i++) {
        const section = sections.nth(i);
        await section.evaluate(element => element.parentElement?.scrollTo({ top: element.offsetTop, behavior: 'instant' }));
        await expect(section).not.toHaveAttribute('inert', '');
        const bounds = await section.evaluate(element => ({ content: element.scrollWidth, width: element.clientWidth }));
        expect(bounds.content, await section.getAttribute('id') ?? path).toBeLessThanOrEqual(bounds.width + 1);
      }
    }
  });
}

test('passes contrast and target-size checks in populated search and documentation', async ({ page }) => {
  for (const path of ['/2025/suche?q=Fixture', '/2025/dokumentation']) {
    await page.goto(path);
    await expect(page.locator('#main-content')).toBeVisible();
    if (path.endsWith('/dokumentation')) await expect(page.getByRole('heading', { name: /Klassifikation von/ })).toBeVisible();
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        if (animation.effect?.getTiming().iterations !== Infinity) {
          try { animation.finish(); } catch { /* Ignore browser-managed animations. */ }
        }
      }
    });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});
