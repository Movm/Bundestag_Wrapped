import { expect, test, type Page } from 'playwright/test';
import { installEditionFixtures } from './fixtures';

// The e2e runs against the production build: the deep link must not skip a quiz or the cover.
const PROGRESS_KEY = 'bundestag-wrapped-progress:2026:fixture-b';
const QUIZ_SCOPE = 'quiz:2026:fixture-b';
const QUIZZES = ['quiz-topics', 'quiz-signature', 'quiz-drama', 'quiz-common-words', 'quiz-gender'];

/** A reader who started the story (past the cover) and answered the given quizzes. */
async function seedProgress(page: Page, answered: string[]) {
  await page.addInitScript(({ progressKey, scope, answered }) => {
    window.localStorage.setItem(progressKey, JSON.stringify({ currentSection: 'info-disclaimer', savedAt: Date.now() }));
    window.localStorage.setItem('quiz-storage-v2', JSON.stringify({
      state: { answersByScope: { [scope]: Object.fromEntries(answered.map(id => [id, true])) } }, version: 0,
    }));
  }, { progressKey: PROGRESS_KEY, scope: QUIZ_SCOPE, answered });
}

test.beforeEach(async ({ page }) => {
  await installEditionFixtures(page);
});

test('opens on the linked slide once every quiz before it is answered', async ({ page }) => {
  await seedProgress(page, QUIZZES);
  await page.goto('/2026#reveal-drama');
  await expect(page.locator('[data-slide-id="reveal-drama"]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('[data-slide-id="intro"]')).toHaveAttribute('data-active', 'false');
});

test('stops at the first unanswered quiz instead of skipping it', async ({ page }) => {
  await seedProgress(page, []);
  await page.goto('/2026#reveal-drama');
  await expect(page.locator('[data-slide-id="quiz-topics"]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('[data-slide-id="reveal-drama"]')).toHaveAttribute('data-active', 'false');
});

test('keeps the cover gate for a reader who has not started', async ({ page }) => {
  await page.goto('/2026#reveal-drama');
  await expect(page.locator('[data-slide-id="intro"]')).toHaveAttribute('data-active', 'true');
});

test('ignores an unknown slide id', async ({ page }) => {
  await page.goto('/2026#not-a-slide');
  await expect(page.locator('[data-slide-id="intro"]')).toHaveAttribute('data-active', 'true');
});
