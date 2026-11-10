import { expect, test } from 'playwright/test';
import { installEditionFixtures } from './fixtures';
import { jumpToSlide } from './story-navigation';

test.beforeEach(async ({ page }) => {
  await installEditionFixtures(page);
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`answers a quiz and keeps persistent feedback with reducedMotion=${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/2025');
    await jumpToSlide(page, (await page.locator('#quiz-topics').getAttribute('id'))!);
    const quiz = page.locator('#quiz-topics');
    const answer = quiz.getByRole('button').first();
    await answer.click();
    await expect(answer).toHaveAttribute('aria-disabled', 'true');
    await expect(answer).toBeFocused();
    const status = quiz.getByRole('status');
    await expect(status).toContainText('Richtige Antwort:');
    // Result is exposed to assistive tech as text on the tile as well.
    await expect(quiz.getByRole('button', { name: /richtig|falsch/ }).first()).toBeVisible();
    if (reducedMotion === 'reduce') await expect(quiz.locator('.w-3.h-3')).toHaveCount(0);
    // The result is a card in the layout and stays: no timeout.
    await page.waitForTimeout(2500);
    await expect(status).toContainText('Richtige Antwort:');
    await expect(answer).toBeFocused();
  });
}
