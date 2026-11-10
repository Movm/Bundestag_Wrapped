import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';
import { installEditionFixtures } from './fixtures';

/**
 * Every story slide, every target screen: nothing may overflow sideways or get
 * clipped, and every slide passes axe (WCAG 2.2 AA) on a phone and a laptop.
 * Runs once (chromium); layout does not differ meaningfully between engines.
 */
const VIEWPORTS = [
  { name: 'phone-small', width: 320, height: 568, axe: false },
  { name: 'phone', width: 390, height: 844, axe: true },
  { name: 'phone-landscape', width: 844, height: 390, axe: false },
  { name: 'tablet', width: 768, height: 1024, axe: false },
  // A 1280×900 window at 200 % browser zoom (WCAG 1.4.4) lays out like 640×450.
  { name: 'zoom-200', width: 640, height: 450, axe: false },
  { name: 'laptop', width: 1440, height: 900, axe: true },
  { name: 'desktop', width: 1920, height: 1080, axe: false },
] as const;

test.skip(({ browserName }) => browserName !== 'chromium', 'Layout matrix runs on chromium only.');
test.describe.configure({ mode: 'parallel' });

async function openReadingMode(page: Page) {
  await page.goto('/2025');
  await expect(page.locator('[data-slide-id]').first()).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Foliennavigation', exact: true });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('checkbox', { name: /Lesemodus/ }).check();
  await page.getByRole('button', { name: 'Navigation schließen' }).click();
}

async function settle(page: Page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getTiming().iterations !== Infinity) {
        try { animation.finish(); } catch { /* browser-managed */ }
      }
    }
  });
}

for (const viewport of VIEWPORTS) {
  test(`every slide fits and reads well on ${viewport.name} (${viewport.width}×${viewport.height})`, async ({ page }) => {
    test.setTimeout(240_000);
    await installEditionFixtures(page);
    // Measure the settled layout: reduced motion skips entrance transforms.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openReadingMode(page);
    await expect(page.getByRole('progressbar', { name: 'Fortschritt' })).toHaveAttribute('aria-valuetext', /^Folie \d+ von \d+$/);
    const ids = await page.$$eval('[data-slide-id]', sections => sections.map(section => section.getAttribute('data-slide-id')!));
    const problems: string[] = [];
    for (const id of ids) {
      const section = page.locator(`[data-slide-id="${id}"]`);
      await section.evaluate(element => element.parentElement!.scrollTo({ top: (element as HTMLElement).offsetTop, behavior: 'instant' }));
      await expect(section).toHaveAttribute('data-slide-effects-active', 'true');
      await page.waitForTimeout(150);
      await settle(page);
      const issues = await section.evaluate(element => {
        const found: string[] = [];
        const root = document.documentElement;
        if (root.scrollWidth > root.clientWidth + 1) found.push(`page scrolls sideways (${root.scrollWidth} > ${root.clientWidth})`);
        const bounds = element.getBoundingClientRect();
        for (const node of element.querySelectorAll<HTMLElement>('h1, h2, h3, p, button, li, th, td, a')) {
          if (node.closest('[aria-hidden="true"], .sr-only')) continue;
          const box = node.getBoundingClientRect();
          if (!box.width) continue;
          const text = (node.textContent ?? '').trim().slice(0, 40);
          if (box.right > bounds.right + 1 || box.left < bounds.left - 1) found.push(`outside the slide: "${text}"`);
          else if (node.scrollWidth > node.clientWidth + 2 && getComputedStyle(node).overflowX !== 'visible') found.push(`clipped: "${text}"`);
        }
        return found;
      });
      problems.push(...issues.map(issue => `${id}: ${issue}`));
      if (viewport.axe) {
        const results = await new AxeBuilder({ page }).include(`[data-slide-id="${id}"]`).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
        problems.push(...results.violations.map(violation => `${id}: axe ${violation.id} (${violation.nodes.length}×) ${violation.nodes[0]?.target.join(' ')}`));
      }
    }
    expect(problems).toEqual([]);
  });
}
