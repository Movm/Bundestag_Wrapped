import { jumpToSlide, expectInlineQuizResult } from './story-navigation';
import { expect, test } from 'playwright/test';
import { installEditionFixtures } from './fixtures';

test('retains the active slide through rotation and allows subsequent navigation', async ({ page }) => {
  await installEditionFixtures(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/2025');
  const slide = page.locator('#quiz-drama');
  await jumpToSlide(page, (await slide.getAttribute('id'))!);
  await expect(slide).not.toHaveAttribute('inert', '');
  const answer = slide.getByRole('button').first();
  await answer.click();
  await expect(slide.getByRole('status')).toContainText(/Deine Antwort ist (richtig|falsch)/);
  await expectInlineQuizResult(page);
  await slide.focus();
  await expect(slide).toBeFocused();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  await expect(slide).not.toHaveAttribute('inert', '');
  await expect(slide).toBeFocused();
  await expect(slide.getByRole('status')).toContainText(/Deine Antwort ist (richtig|falsch)/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await expect(slide).not.toHaveAttribute('inert', '');
  const next = page.locator('#quiz-gender');
  await jumpToSlide(page, (await next.getAttribute('id'))!);
  await expect(next).not.toHaveAttribute('inert', '');
});

test('keeps the relative reading position in a tall section on rotation', async ({ page }) => {
  await installEditionFixtures(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/2025');
  await page.getByRole('button', { name: 'Foliennavigation', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('checkbox', { name: /Lesemodus/ }).check();
  const slide = page.locator('#info-drama');
  await slide.evaluate(el => {
    const extra = document.createElement('div');
    extra.style.height = '1800px';
    el.append(extra);
    const container = el.parentElement!;
    container.scrollTo({ top: el.offsetTop + el.offsetHeight * 0.55 - container.clientHeight / 2, behavior: 'instant' });
  });
  await expect(slide).toHaveAttribute('data-slide-effects-active', 'true');
  const fraction = () => slide.evaluate(el => {
    const parent = el.parentElement!;
    return (parent.getBoundingClientRect().top + parent.clientHeight / 2 - el.getBoundingClientRect().top) / el.getBoundingClientRect().height;
  });
  const before = await fraction();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  await expect(slide).toHaveAttribute('data-slide-effects-active', 'true');
  expect(Math.abs((await fraction()) - before)).toBeLessThan(0.06);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await expect(slide).toHaveAttribute('data-slide-effects-active', 'true');
  expect(Math.abs((await fraction()) - before)).toBeLessThan(0.06);
});
