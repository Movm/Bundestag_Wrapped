import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

import { installEditionFixtures } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installEditionFixtures(page);
});

test('redirects to the fixture current edition and starts a keyboard-operable journey', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/2025$/);

  const start = page.getByRole('button', { name: 'Starten', exact: true });
  await start.focus();
  await expect(start).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-slide-id="info-disclaimer"]')).toBeVisible();
  await expect(page.locator('[data-slide-id^="quiz-"]')).toHaveCount(6);
});

test('omits only the unavailable speech quiz group for its fixture edition', async ({ page }) => {
  await page.goto('/2026');
  await expect(page.locator('[data-slide-id="quiz-speeches"]')).toHaveCount(0);
  await expect(page.locator('[data-slide-id="quiz-topics"]')).toHaveCount(1);
  await expect(page.locator('[data-slide-id^="quiz-"]')).toHaveCount(5);
});

test('unknown editions stay in a controlled, accessible error state', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('Fehler beim Laden', { exact: true })).toBeVisible();
  await expect(page.getByText('Unknown edition: does-not-exist', { exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
