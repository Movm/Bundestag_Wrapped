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

test('keeps an index result and its destinations within the active preview edition', async ({ page }) => {
  await page.goto('/2026/abgeordnete');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://bundestag-wrapped.de/2026/abgeordnete');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');

  await page.getByRole('textbox', { name: 'Abgeordneten suchen' }).fill('Bea');
  const profile = page.getByRole('link', { name: 'Bea Ausgabe Zwei Partei Beta' });
  await expect(profile).toHaveAttribute('href', '/2026/abgeordnete/shared-speaker');
  await expect(page.getByRole('link', { name: 'Wrapped', exact: true })).toHaveAttribute('href', '/2026/wrapped/shared-speaker');
  await expect(page.getByText('Alex Ausgabe Eins')).toHaveCount(0);
});

test('does not retain a same-slug profile or canonical from another edition', async ({ page }) => {
  await page.goto('/2025/abgeordnete/shared-speaker');
  await expect(page.getByRole('heading', { name: 'Alex Ausgabe Eins' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://bundestag-wrapped.de/2025/abgeordnete/shared-speaker');

  const profileResponse = page.waitForResponse('**/data/fixtures/2026/speakers/shared-speaker.json');
  await page.goto('/2026/abgeordnete/shared-speaker');
  expect((await profileResponse).ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Bea Ausgabe Zwei' })).toBeVisible();
  await expect(page.getByText('Alex Ausgabe Eins')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://bundestag-wrapped.de/2026/abgeordnete/shared-speaker');
  await expect(page.getByRole('link', { name: '← Alle Abgeordneten' })).toHaveAttribute('href', '/2026/abgeordnete');
  await expect(page.getByRole('link', { name: 'Reden durchsuchen' })).toHaveAttribute('href', /\/2026\/suche\?tab=speeches/);
});

test('unknown editions stay in a controlled, accessible error state', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('Fehler beim Laden', { exact: true })).toBeVisible();
  await expect(page.getByText('Unknown edition: does-not-exist', { exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
