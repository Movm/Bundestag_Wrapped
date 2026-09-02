import { expect, test } from 'playwright/test';

test('redirects the legacy entry to the registered current edition', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/2025$/);
  await expect(page.getByRole('button').first()).toBeVisible();
});

test('starts the Wrapped journey and exposes a keyboard-operable quiz gate', async ({ page }) => {
  await page.goto('/2025');
  const start = page.getByRole('button').first();
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-slide-id="info-disclaimer"]')).toBeVisible();
  expect(await page.locator('[data-slide-id^="quiz-"]').count()).toBeGreaterThan(0);
});

test('unknown edition reports a controlled local error state', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('Fehler beim Laden', { exact: true })).toBeVisible();
  await expect(page.getByText('Unknown edition: does-not-exist', { exact: true })).toBeVisible();
});
