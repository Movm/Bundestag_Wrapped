import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';
import { installEditionFixtures } from './fixtures';
import { answerQuiz, expectInlineQuizResult, jumpToSlide, storyStart } from './story-navigation';

// The real section of the 2026 preview, on top of the small fixture edition.
const chancellor = JSON.parse(readFileSync(new URL('../public/data/2026/preview-2026-11-10-match/wrapped.json', import.meta.url), 'utf8')).chancellor;

const SLIDES = ['intro-chancellor', 'quiz-chancellor', 'info-chancellor', 'reveal-chancellor', 'reveal-chancellor-topics', 'reveal-chancellor-words'];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

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
  await expect(page.locator('#quiz-chancellor [data-testid="quiz-result"]')).toContainText('44 % seiner Themenwörter gehören zur Außenpolitik');

  await jumpToSlide(page, 'reveal-chancellor');
  await expect(page.locator('#reveal-chancellor')).toContainText('Innenkanzler. Knapp.');
  await expect(page.locator('#reveal-chancellor tbody tr')).toHaveCount(3);

  for (const slide of SLIDES) {
    await jumpToSlide(page, slide);
    // Axe measures colours as rendered: wait until the entrances on screen have faded in.
    await page.waitForFunction(id => [...document.querySelectorAll(`#${id} [style*="opacity"]`)]
      .filter(el => el.getBoundingClientRect().top < innerHeight)
      .every(el => getComputedStyle(el).opacity === '1'), slide);
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
