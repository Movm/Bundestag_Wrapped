import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';
import { installEditionFixtures } from './fixtures';

test.describe('construction front door while the current edition is superseded', () => {
  test.beforeEach(async ({ page }) => {
    await installEditionFixtures(page, { superseded: ['2025'] });
  });

  for (const path of ['/', '/2025', '/2025/abgeordnete/shared-speaker', '/2025/dokumentation', '/suche', '/wrapped/shared-speaker']) {
    test(`shows the construction page on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: /Wir bauen 2026/i })).toBeVisible();
      await expect(page.getByRole('link', { name: 'MCP-Server für deine KI' })).toBeVisible();
      await expect(page.locator('[data-slide-id]')).toHaveCount(0);
    });
  }

  test('keeps the preview, MCP and legal pages reachable', async ({ page }) => {
    await page.goto('/2026');
    await expect(page.locator('#intro')).toBeVisible();
    await page.goto('/mcp');
    await expect(page.getByRole('heading', { level: 1, name: /Wir bauen/i })).toHaveCount(0);
    await page.goto('/datenschutz');
    await expect(page.getByRole('heading', { level: 1, name: /Wir bauen/i })).toHaveCount(0);
  });

  test('fits a phone and passes Axe', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /Wir bauen 2026/i })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(width).toBeLessThanOrEqual(1);
    // Judge contrast at rest, not mid-entrance (Firefox is still fading the headline in).
    for (const element of await page.locator('h1, .bw-site__main > *').all()) await expect(element).toHaveCSS('opacity', '1');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
