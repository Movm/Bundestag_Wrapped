import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';
import { installEditionFixtures } from './fixtures';
import { answerQuiz, expectInlineQuizResult, jumpToSlide, storyStart } from './story-navigation';

// The real section of the 2026 preview, on top of the small fixture edition.
const chancellor = JSON.parse(readFileSync(new URL('../public/data/2026/preview-2026-11-10-match/wrapped.json', import.meta.url), 'utf8')).chancellor;

const SLIDES = ['intro-chancellor', 'quiz-chancellor', 'reveal-chancellor-topics', 'reveal-chancellor', 'reveal-chancellor-focus'];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

/**
 * Waits until the entrances on screen (at least a fifth visible, like IN_VIEW) have faded in.
 * Axe measures colours as rendered, and leaving a slide mid-entrance can leave a
 * `once` shape entrance unfinished.
 */
async function settle(page: Page, id: string) {
  await page.waitForFunction(slide => [...document.querySelectorAll(`#${slide} [style*="opacity"]`)]
    .filter(el => { const rect = el.getBoundingClientRect(); return rect.top < innerHeight - rect.height * 0.2; })
    .every(el => getComputedStyle(el).opacity === '1'), id);
}

test('tells the Innen-/Außenkanzler chapter only when the edition has the section', async ({ page }) => {
  await installEditionFixtures(page, { wrappedExtras: { chancellor } });
  await page.goto('/2026');
  await expect(storyStart(page)).toBeVisible();
  const ids = await page.locator('[data-slide-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-slide-id')));
  expect(ids.filter(id => id?.includes('chancellor'))).toEqual(SLIDES);
  await storyStart(page).click();

  await jumpToSlide(page, 'intro-chancellor');
  await expect(page.locator('#intro-chancellor')).toContainText('Friedrich Merz kommt 2026 auf acht Reden und 101 Antworten in der Regierungsbefragung.');

  await jumpToSlide(page, 'quiz-chancellor');
  await answerQuiz(page, 'quiz-chancellor', true);
  await expectInlineQuizResult(page);
  await expect(page.locator('#quiz-chancellor [data-testid="quiz-result"]')).toContainText('Deine Antwort ist richtig.');
  await expect(page.locator('#quiz-chancellor').getByRole('button', { name: /44 %.*richtig/ })).toBeVisible();

  await jumpToSlide(page, 'reveal-chancellor');
  await settle(page, 'reveal-chancellor');
  await expect(page.locator('#reveal-chancellor')).toContainText('Merz spricht etwas mehr über innen- als über außenpolitische Themen.');
  await expect(page.locator('#reveal-chancellor .ds-io')).toHaveCount(2);

  await jumpToSlide(page, 'reveal-chancellor-focus');
  await settle(page, 'reveal-chancellor-focus');
  await expect(page.locator('#reveal-chancellor-focus')).toContainText('Europa-Kanzler?');

  for (const slide of SLIDES) {
    await jumpToSlide(page, slide);
    await settle(page, slide);
    const results = await new AxeBuilder({ page }).include(`#${slide}`).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(results.violations, slide).toEqual([]);
  }
});

test('leaves the chapter out for an edition without the section', async ({ page }) => {
  await installEditionFixtures(page);
  await page.goto('/2025');
  await expect(storyStart(page)).toBeVisible();
  await expect(page.locator('[data-slide-id*="chancellor"]')).toHaveCount(0);
});
