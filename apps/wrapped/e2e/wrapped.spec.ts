import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

import { installEditionFixtures } from './fixtures';

test.beforeEach(async ({ page }) => {
  await installEditionFixtures(page);
});

async function scrollToNextSlide(page: Page, currentSlide: string, nextSlide: string) {
  const current = page.locator(`[data-slide-id="${currentSlide}"]`);
  await moveToSlide(page, currentSlide);
  await expect(current).toBeVisible();
  await moveToSlide(page, nextSlide);
}

async function moveToSlide(page: Page, slide: string) {
  await page.locator(`[data-slide-id="${slide}"]`).evaluate((section) => {
    section.parentElement?.scrollTo({ top: section.offsetTop, behavior: 'instant' });
  });
}

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

test('completes the fixture journey with a quiz gate, mixed answers, and the active plan', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/2025');

  await page.getByRole('button', { name: 'Starten', exact: true }).click();
  await expect(page.locator('[data-slide-id="info-disclaimer"]')).toBeVisible();

  const activeSlides = [
    'info-disclaimer', 'intro-topics', 'quiz-topics', 'info-topics', 'reveal-topics', 'info-party-topics', 'reveal-party-topics',
    'intro-vocabulary', 'quiz-signature', 'info-signature', 'reveal-signature', 'intro-speeches', 'quiz-speeches', 'info-speeches',
    'chart-speeches', 'intro-drama', 'quiz-drama', 'info-drama', 'reveal-drama', 'intro-common-words', 'quiz-common-words',
    'reveal-common-words', 'quiz-gender', 'info-gender', 'reveal-gender', 'share',
  ];

  for (const [index, slide] of activeSlides.entries()) {
    const nextSlide = activeSlides[index + 1];
    if (!nextSlide) break;

    const section = page.locator(`[data-slide-id="${slide}"]`);
    if (slide.startsWith('quiz-')) {
      const answers = section.getByRole('button');
      await expect(answers.first()).toBeVisible();
      await answers.nth(slide === 'quiz-signature' ? 1 : 0).click();
      await expect(section.getByText('Scroll weiter')).toBeVisible();
      await scrollToNextSlide(page, slide, nextSlide);
      continue;
    }

    await scrollToNextSlide(page, slide, nextSlide);
  }

  await expect(page.locator('[data-slide-id="share"]')).toContainText('Teile dein Ergebnis!');
  await expect(page.locator('[data-slide-id^="quiz-"]')).toHaveCount(6);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('quiz-storage'))).toContain('"quiz-signature":false');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('quiz-storage'))).toContain('"quiz-topics":true');
  await scrollToNextSlide(page, 'share', 'finale');
  await expect(page.locator('[data-slide-id="finale"]').getByRole('heading', { name: 'Bundestag Wrapped' })).toBeVisible();
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

test('loads the active edition speech fixture through the profile search route', async ({ page }) => {
  await page.goto('/2026/suche?tab=speeches&q=Bea');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://bundestag-wrapped.de/2026/suche');
  await expect(page.locator('[role="tabpanel"] p').first()).toHaveText(/1\s+Reden gefunden/);
  await expect(page.getByRole('button', { name: /Bea Ausgabe Zwei/ })).toBeVisible();
  await expect(page.getByText(/Fixture-Rede 2026/)).toBeVisible();
  await expect(page.getByText('Alex Ausgabe Eins')).toHaveCount(0);
});

test('unknown editions stay in a controlled, accessible error state', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('Fehler beim Laden', { exact: true })).toBeVisible();
  await expect(page.getByText('Unknown edition: does-not-exist', { exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
