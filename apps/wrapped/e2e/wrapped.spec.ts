import { expect, test } from 'playwright/test';

test('boots the Wrapped application without an external service', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page).toHaveTitle(/Bundestag Wrapped/i);
});

test('unknown edition reports a local loading error', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText(/Fehler beim Laden|Unknown edition/i)).toBeVisible();
});
