import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/sounds', () => ({ playSound: vi.fn() }));

const quiz = { question: 'Frage?', options: ['A', 'B'], correctAnswer: 'A', explanation: 'Weil.' };

function stubMatchMedia(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

// jsdom has no IntersectionObserver; slide entrances (whileInView) need one.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } root = null; rootMargin = ''; thresholds = []; } as unknown as typeof IntersectionObserver;

let container: HTMLDivElement;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); });
afterEach(() => { container.remove(); });

async function renderQuiz(reduce = false, storedAnswer: boolean | null = null, story?: { next: (id: string) => void; readingMode?: boolean }) {
  stubMatchMedia(reduce);
  // motion caches the reduced-motion preference per process, so pin the hook.
  vi.resetModules();
  vi.doMock('motion/react', async (importOriginal) => ({ ...(await importOriginal<typeof import('motion/react')>()), useReducedMotion: () => reduce }));
  const { SlideQuiz } = await import('./SlideQuiz');
  const { StoryContext } = await import('@/components/main-wrapped/StoryContext');
  const root = createRoot(container);
  const slide = <SlideQuiz quiz={quiz} storedAnswer={storedAnswer} onAnswer={() => {}} onComplete={() => {}} shuffle={false} slideId="quiz-test" />;
  await act(async () => root.render(story ? <StoryContext value={{ activeId: 'quiz-test', readingMode: story.readingMode ?? false, next: story.next }}>{slide}</StoryContext> : slide));
  return root;
}

function button(label: string) {
  return [...container.querySelectorAll('button')].find(b => b.textContent?.startsWith(label))!;
}

it('announces the result in a polite live region without moving focus', async () => {
  const root = await renderQuiz();
  const region = container.querySelector('[role="status"]')!;
  expect(region.getAttribute('aria-live')).toBe('polite');
  expect(region.textContent).toBe('');
  const answer = button('A');
  answer.focus();
  await act(async () => answer.click());
  expect(region.textContent).toContain('Deine Antwort ist richtig.');
  expect(document.activeElement).toBe(answer);
  expect(answer.getAttribute('aria-disabled')).toBe('true');
  expect(answer.textContent).toContain('richtig');
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  await act(async () => root.unmount());
});

it('says wrong answers in words, not only in color', async () => {
  const root = await renderQuiz();
  await act(async () => button('B').click());
  expect(container.querySelector('[role="status"]')!.textContent).toContain('Deine Antwort ist falsch. Richtig ist: A.');
  expect(button('B').textContent).toContain('falsch');
  await act(async () => root.unmount());
});

it('renders confetti only inside an aria-hidden, non-interactive layer', async () => {
  const root = await renderQuiz();
  await act(async () => button('A').click());
  const piece = container.querySelector('.ds-confetti');
  expect(piece).not.toBeNull();
  const layer = piece!.closest('[aria-hidden="true"]')!;
  expect(layer.className).toContain('pointer-events-none');
  await act(async () => root.unmount());
});

it('drops confetti but keeps the result under reduced motion', async () => {
  const root = await renderQuiz(true);
  await act(async () => button('A').click());
  expect(container.querySelector('.ds-confetti')).toBeNull();
  expect(container.querySelector('[role="status"]')!.textContent).toContain('Deine Antwort ist richtig.');
  await act(async () => root.unmount());
});

it('marks the pick wrong and the right answer instead of showing an answer card', async () => {
  const root = await renderQuiz();
  await act(async () => button('B').click());
  expect(document.querySelector('dialog')).toBeNull();
  expect(container.querySelector('.ds-result')).toBeNull();
  expect(button('B').dataset.status).toBe('wrong');
  expect(button('A').dataset.status).toBe('correct');
  expect(container.querySelector('[data-testid="quiz-result"]')!.getAttribute('data-correct')).toBe('false');
  await act(async () => root.unmount());
});

it('shows a restored answer as right or wrong and does not move on by itself', async () => {
  vi.useFakeTimers();
  const next = vi.fn();
  let root = await renderQuiz(false, false, { next });
  expect(button('A').dataset.status).toBe('correct');
  const status = container.querySelector('[data-testid="quiz-result"]')!;
  expect(status.textContent).toBe('Deine Antwort ist falsch. Richtig ist: A.');
  expect(container.textContent).not.toContain('gespeichert');
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(next).not.toHaveBeenCalled();
  await act(async () => root.unmount());

  root = await renderQuiz(false, true, { next });
  expect(container.querySelector('[data-testid="quiz-result"]')!.getAttribute('data-correct')).toBe('true');
  await act(async () => root.unmount());
  vi.useRealTimers();
});

it('moves on to the next slide after a pick, later after a miss, never in reading mode', async () => {
  vi.useFakeTimers();
  const next = vi.fn();
  let root = await renderQuiz(false, null, { next });
  await act(async () => button('A').click());
  await act(async () => { vi.advanceTimersByTime(1400); });
  expect(next).not.toHaveBeenCalled();
  await act(async () => { vi.advanceTimersByTime(200); });
  expect(next).toHaveBeenCalledWith('quiz-test');
  await act(async () => root.unmount());

  next.mockClear();
  root = await renderQuiz(false, null, { next });
  await act(async () => button('B').click());
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect(next).not.toHaveBeenCalled();
  await act(async () => { vi.advanceTimersByTime(700); });
  expect(next).toHaveBeenCalledTimes(1);
  await act(async () => root.unmount());

  next.mockClear();
  root = await renderQuiz(false, null, { next, readingMode: true });
  await act(async () => button('A').click());
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(next).not.toHaveBeenCalled();
  await act(async () => root.unmount());
  vi.useRealTimers();
});
