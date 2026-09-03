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
      // The result overlay may auto-advance before a browser paints the visual
      // scroll hint. Disabled options are the stable, user-visible gate state.
      await expect(answers.first()).toBeDisabled();
      await scrollToNextSlide(page, slide, nextSlide);
      continue;
    }

    await scrollToNextSlide(page, slide, nextSlide);
  }

  await expect(page.locator('[data-slide-id="share"]')).toContainText('Teile dein Ergebnis!');
  await expect(page.locator('[data-slide-id^="quiz-"]')).toHaveCount(6);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('quiz-storage-v2'))).toContain('"quiz-signature":false');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('quiz-storage-v2'))).toContain('"quiz-topics":true');
  await scrollToNextSlide(page, 'share', 'finale');
  await expect(page.locator('[data-slide-id="finale"]').getByRole('heading', { name: 'Bundestag Wrapped' })).toBeVisible();
});

test('uses the active edition for share and download output', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (payload: { files: File[]; title: string; url: string }) => {
        window.localStorage.setItem('fixture-share', JSON.stringify({
          filename: payload.files[0]?.name,
          title: payload.title,
          url: payload.url,
        }));
      },
    });
  });
  await page.goto('/2026');
  await moveToSlide(page, 'share');

  const shareSlide = page.locator('[data-slide-id="share"]');
  await expect(shareSlide.getByRole('heading', { name: 'Teile dein Ergebnis!' })).toBeVisible();
  await expect(shareSlide.getByRole('button', { name: 'Teilen' }).first()).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await shareSlide.getByRole('button', { name: 'Speichern' }).first().click();
  expect((await downloadPromise).suggestedFilename()).toBe('bundestag-wrapped-2026.png');

  await shareSlide.getByRole('button', { name: 'Teilen' }).first().click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('fixture-share'))).toBe(JSON.stringify({
    filename: 'bundestag-wrapped-2026.png',
    title: 'Mein Fixture Wrapped 2026',
    url: 'http://127.0.0.1:4173/2026',
  }));
});

test('keeps annual navigation, share FAB and its dialog accessible', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => undefined });
  });
  await page.goto('/2026/abgeordnete?fixture=yes#directory');
  await expect(page.getByRole('link', { name: 'Bundestag Wrapped - Zur Startseite' })).toHaveAttribute('href', '/2026?fixture=yes#directory');
  await page.getByRole('button', { name: 'Menü öffnen' }).click();
  await expect(page.getByRole('link', { name: 'Dokumentation' })).toHaveAttribute('href', '/2026/dokumentation?fixture=yes#directory');
  await page.keyboard.press('Escape');

  await page.goto('/2026');
  await moveToSlide(page, 'reveal-drama');
  const trigger = page.getByRole('button', { name: 'Diese Folie teilen' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Diese Folie teilen' });
  await expect(dialog).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('does not expose fixture quiz answers across annual routes', async ({ page }) => {
  await page.goto('/2025');
  await page.evaluate(() => {
    localStorage.setItem('quiz-storage-v2', JSON.stringify({
      state: { answersByScope: { 'quiz:2025:fixture-a': { 'quiz-topics': true } } },
      version: 0,
    }));
  });
  await page.reload();
  await page.goto('/2026');
  await expect(page.locator('[data-slide-id="quiz-topics"]')).toContainText('Quiz');
  await expect(page.locator('[data-slide-id="quiz-topics"]').getByText('Scroll weiter')).toHaveCount(0);
});

test('keeps same-slug speaker quiz state edition-scoped and clears it from the speaker restart control', async ({ page }) => {
  await page.goto('/2025/wrapped/shared-speaker');
  await page.evaluate(() => {
    localStorage.setItem('speaker-quiz-storage-v2', JSON.stringify({
      state: { answersByScope: { 'speaker-quiz:shared-speaker:2025:fixture-a': { 'shared-speaker': true } } },
      version: 0,
    }));
  });
  await page.reload();
  await moveToSlide(page, 'speaker-share');
  await expect(page.getByRole('button', { name: 'Nochmal ansehen' })).toBeVisible();
  await page.getByRole('button', { name: 'Nochmal ansehen' }).click();
  await expect(page.locator('[data-slide-id="speaker-intro"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('speaker-quiz-storage-v2'))).not.toContain('speaker-quiz:shared-speaker:2025:fixture-a');

  await page.goto('/2026/wrapped/shared-speaker');
  await moveToSlide(page, 'speaker-quiz');
  await expect(page.getByRole('button', { name: 'fixture', exact: true })).toBeEnabled();
});

test('renders documentation statistics from each edition payload instead of global values', async ({ page }) => {
  await page.goto('/2025/dokumentation');
  await expect(page.getByText('10', { exact: true })).toBeVisible();
  await expect(page.getByText('Fraktionen')).toBeVisible();

  await page.goto('/2026/dokumentation');
  await expect(page.getByText('20', { exact: true })).toBeVisible();
  await expect(page.getByText('5', { exact: true })).toHaveCount(2);
});

test('runs Axe against the annual start, answered quiz, search, speaker index, profile, and controlled error routes', async ({ page }) => {
  const scan = async () => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  };

  await page.goto('/2025');
  await expect(page.getByRole('button', { name: 'Starten', exact: true })).toBeVisible();
  await scan();
  await page.getByRole('button', { name: 'Starten', exact: true }).click();
  await moveToSlide(page, 'quiz-topics');
  const answer = page.locator('[data-slide-id="quiz-topics"]').getByRole('button').first();
  await answer.click();
  await expect(answer).toBeDisabled();
  await scan();

  for (const path of ['/2025/suche', '/2025/abgeordnete', '/2025/abgeordnete/shared-speaker', '/does-not-exist']) {
    await page.goto(path);
    if (path === '/does-not-exist') {
      await expect(page.getByText('Fehler beim Laden', { exact: true })).toBeVisible();
    } else {
      await expect(page.locator('#main-content')).toBeVisible();
    }
    await scan();
  }
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
