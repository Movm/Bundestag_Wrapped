import { expect, type Page } from 'playwright/test';

/** Explicit reading-mode jump for tests inspecting distant content, not quiz progression. */
export async function jumpToSlide(page: Page, id: string) {
  const toggle = page.getByRole('button', { name: 'Foliennavigation', exact: true });
  const reading = page.getByRole('checkbox', { name: /Lesemodus/ });
  // A slide arriving right now (e.g. after "Starten") takes focus on arrival;
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

/** A fresh answer opens the result dialog shortly after; close it ("Zum Quiz") and return to the slide. */
export async function closeQuizResult(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Richtige Antwort');
  await dialog.getByRole('button', { name: 'Zum Quiz' }).click();
  await expect(dialog).toBeHidden();
}

/**
 * "Starten" on the story's own cover slide. The boot cover in index.html shows
 * the same button before React has rendered; this one means the story is ready.
 */
export function storyStart(page: Page) {
  return page.locator('#intro').getByRole('button', { name: 'Starten', exact: true });
}
