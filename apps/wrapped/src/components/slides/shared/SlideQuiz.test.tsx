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

async function renderQuiz(reduce = false) {
  stubMatchMedia(reduce);
  // motion caches the reduced-motion preference per process, so pin the hook.
  vi.resetModules();
  vi.doMock('motion/react', async (importOriginal) => ({ ...(await importOriginal<typeof import('motion/react')>()), useReducedMotion: () => reduce }));
  const { SlideQuiz } = await import('./SlideQuiz');
  const root = createRoot(container);
  await act(async () => root.render(<SlideQuiz quiz={quiz} onAnswer={() => {}} onComplete={() => {}} shuffle={false} />));
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
  expect(region.textContent).toContain('Weil.');
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
  const piece = container.querySelector('.w-3.h-3');
  expect(piece).not.toBeNull();
  const layer = piece!.closest('[aria-hidden="true"]')!;
  expect(layer.className).toContain('pointer-events-none');
  await act(async () => root.unmount());
});

it('drops confetti but keeps the result under reduced motion', async () => {
  const root = await renderQuiz(true);
  await act(async () => button('A').click());
  expect(container.querySelector('.w-3.h-3')).toBeNull();
  expect(container.querySelector('[role="status"]')!.textContent).toContain('Genau richtig!');
  await act(async () => root.unmount());
});

it('keeps the result on the slide with the answer in words and opens no popup', async () => {
  const root = await renderQuiz();
  await act(async () => button('B').click());
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 700)); });
  expect(document.querySelector('dialog')).toBeNull();
  const result = container.querySelector('[data-testid="quiz-result"]')!;
  expect(result.textContent).toContain('Diesmal nicht. Richtig ist: A');
  await act(async () => root.unmount());
});
