import { expect, test } from 'playwright/test';
import { installEditionFixtures } from './fixtures';
import { jumpToSlide, expectInlineQuizResult, storyStart } from './story-navigation';

test.beforeEach(async ({ page }) => {
  await installEditionFixtures(page);
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`answers a quiz, marks the result and moves on with reducedMotion=${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/2025');
    await jumpToSlide(page, (await page.locator('#quiz-topics').getAttribute('id'))!);
    const quiz = page.locator('#quiz-topics');
    const answer = quiz.getByRole('button').first();
    await answer.click();
    await expect(answer).toHaveAttribute('aria-disabled', 'true');
    await expect(answer).toBeFocused();
    const status = quiz.getByRole('status');
    await expect(status).toContainText(/Deine Antwort ist (richtig|falsch)/);
    // Result is exposed to assistive tech as text on the tile as well.
    await expect(quiz.getByRole('button', { name: /richtig|falsch/ }).first()).toBeVisible();
    // No popup: the answer keeps focus.
    await expectInlineQuizResult(page);
    await expect(answer).toBeFocused();
    if (reducedMotion === 'reduce') await expect(quiz.locator('.ds-confetti')).toHaveCount(0);
    // The marked answer stays briefly, then the story moves on by itself.
    await expect(quiz).toHaveAttribute('inert', '', { timeout: 5000 });
  });
}

test('scrolls straight on after answering', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/2025');
  await storyStart(page).click();
  await jumpToSlide(page, 'quiz-topics');
  const quiz = page.locator('#quiz-topics');
  await quiz.getByRole('button').first().click();
  await expectInlineQuizResult(page);
  // A tall slide first scrolls its own overflow; the key keeps working from the answered option.
  await expect(async () => {
    await page.keyboard.press('ArrowDown');
    await expect(quiz).toHaveAttribute('data-active', 'false', { timeout: 600 });
  }).toPass({ timeout: 6000 });
});

test('starts again from the cover after coming back to it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/2025');
  const start = storyStart(page);
  await start.click();
  await expect(page.locator('#intro')).toHaveAttribute('data-active', 'false');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#intro')).toHaveAttribute('data-active', 'true');
  await start.click();
  await expect(page.locator('#intro')).toHaveAttribute('data-active', 'false');
});

test('shows the cover again, not the pink wipe, after coming back to it', async ({ page }) => {
  await page.goto('/2025');
  await storyStart(page).click();
  await expect(page.locator('#info-disclaimer')).toHaveAttribute('data-active', 'true', { timeout: 10_000 });
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#intro')).toHaveAttribute('data-active', 'true');
  // The wipe is reset (scale 0) and the title is back.
  await expect.poll(() => page.locator('#intro .cv-burst').evaluate(el => getComputedStyle(el).transform)).toBe('matrix(0, 0, 0, 0, 0, 0)');
  await expect(page.locator('#intro h1')).toBeVisible();
});

test('draws the cover at full size when a restored story goes back to it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/2025');
  await storyStart(page).click();
  await expect(page.locator('#info-disclaimer')).toHaveAttribute('data-active', 'true');
  // Reload: the story resumes at the saved slide and builds the cover off screen.
  await page.reload();
  await expect(page.locator('#info-disclaimer')).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#intro')).toHaveAttribute('data-active', 'true');
  // Star layers are painted at their real size, not as a stretched 1×1 pixel.
  await expect.poll(() => page.locator('#intro .cv-stars canvas').first().evaluate(c => (c as HTMLCanvasElement).width)).toBeGreaterThan(100);
});
