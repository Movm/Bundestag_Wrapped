import { expect, type Page } from 'playwright/test';

/** Explicit reading-mode jump for tests inspecting distant content, not quiz progression. */
export async function jumpToSlide(page: Page, id: string) {
  const toggle = page.getByRole('button', { name: 'Foliennavigation', exact: true });
  await toggle.focus();
  await page.keyboard.press('Enter');
  const reading = page.getByRole('checkbox', { name: /Lesemodus/ });
  await reading.check();
  const section = page.locator(`[data-slide-id="${id}"]`);
  await section.evaluate(el => el.parentElement!.scrollTo({ top: el.offsetTop, behavior: 'instant' }));
  await expect(section).toHaveAttribute('data-slide-effects-active', 'true');
  await reading.uncheck();
  await expect(section).not.toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Navigation schließen' }).click();
}
