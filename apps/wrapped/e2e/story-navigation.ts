import { expect, type Page } from 'playwright/test';
import { seededShuffle } from '../src/design-system/quiz/layouts';

/** Explicit reading-mode jump for tests inspecting distant content, not quiz progression. */
export async function jumpToSlide(page: Page, id: string) {
  const toggle = page.getByRole('button', { name: 'Foliennavigation', exact: true });
  const reading = page.getByRole('checkbox', { name: /Lesemodus/ });
  // A slide arriving right now (e.g. after "Los geht’s") takes focus on arrival;
  // if that lands between focus() and Enter, open the navigation again.
  await expect(async () => {
    if (!(await reading.isVisible())) {
      await toggle.focus();
      await page.keyboard.press('Enter');
    }
    await expect(reading).toBeVisible({ timeout: 1000 });
  }).toPass();
  await reading.check();
  const section = page.locator(`[data-slide-id="${id}"]`);
  await section.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await expect(section).toHaveAttribute('data-slide-effects-active', 'true');
  await reading.uncheck();
  await expect(section).not.toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Navigation schließen' }).click();
}

/** The result is announced on the slide (the options show it); no popup opens. */
export async function expectInlineQuizResult(page: Page) {
  await expect(page.locator('[data-active="true"] [data-testid="quiz-result"]')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

/**
 * "Los geht’s" on the story's own cover slide. The boot cover in index.html shows
 * the same button before React has rendered; this one means the story is ready.
 */
export function storyStart(page: Page) {
  return page.locator('#intro').getByRole('button', { name: 'Los geht’s', exact: true });
}

/**
 * Answer buttons are shuffled per question (seed `${slideId}:${question}`) and the
 * correct one is built first, so the same shuffle over indices says where it is.
 */
export async function answerQuiz(page: Page, slideId: string, correct: boolean) {
  const group = page.locator(`[data-slide-id="${slideId}"] [role="group"][aria-labelledby]`);
  const question = await group.evaluate(el => document.getElementById(el.getAttribute('aria-labelledby')!)!.textContent!);
  const answers = group.getByRole('button');
  await expect(answers.first()).toBeVisible();
  const order = seededShuffle([...Array(await answers.count()).keys()], `${slideId}:${question}`);
  const correctAt = order.indexOf(0);
  await answers.nth(correct ? correctAt : (correctAt + 1) % order.length).click();
}
