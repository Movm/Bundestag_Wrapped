import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Quiz } from './Quiz';
import type { QuizLayoutId } from './layouts';

vi.mock('@/lib/sounds', () => ({ playSound: vi.fn() }));

const quiz = {
  question: 'Wer ist neu auf Platz 1?',
  options: ['Wirtschaft', 'Sicherheit', 'Klima', 'Finanzen'],
  correctAnswer: 'Wirtschaft',
  explanation: 'Weil.',
};

window.matchMedia = ((query: string) => ({
  matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
})) as typeof window.matchMedia;
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } root = null; rootMargin = ''; thresholds = []; } as unknown as typeof IntersectionObserver;

let container: HTMLDivElement;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); });
afterEach(() => { container.remove(); });

const LAYOUTS: QuizLayoutId[] = ['fan', 'gap', 'quadrants', 'stickers', 'swipe'];

describe.each(LAYOUTS)('quiz layout %s', (layout) => {
  it('answers through the engine, announces the result and disables the control', async () => {
    const onAnswer = vi.fn();
    const root = createRoot(container);
    await act(async () => root.render(<Quiz quiz={quiz} layout={layout} gapSentence="Platz 1 ist {answer}." onAnswer={onAnswer} />));
    expect(container.querySelector('[data-quiz-layout]')!.getAttribute('data-quiz-layout')).toBe(layout);

    const region = container.querySelector('[role="status"]')!;
    expect(region.textContent).toBe('');
    // swipe starts on card A, every other layout offers one button per option
    const control = [...container.querySelectorAll('button')].find(b => /^(A|✓ Ja)/.test(b.textContent ?? '') && !b.textContent?.startsWith('Nein'))!;
    control.focus();
    await act(async () => control.click());

    expect(onAnswer).toHaveBeenCalledWith(true);
    expect(region.textContent).toContain('Richtige Antwort:');
    expect(control.getAttribute('aria-disabled')).toBe('true');
    expect(control.textContent).toContain('richtig');
    expect(document.activeElement).toBe(control);
    await act(async () => root.unmount());
  });
});

it('swipe turns to the next card on Nein and wraps around', async () => {
  const root = createRoot(container);
  await act(async () => root.render(<Quiz quiz={quiz} layout="swipe" onAnswer={() => {}} />));
  const no = [...container.querySelectorAll('button')].find(b => b.textContent?.includes('Nein'))!;
  const card = () => container.querySelector('.ds-swipe-card')!.textContent;
  expect(card()).toContain('Karte 1 von 4');
  for (let i = 0; i < 4; i++) await act(async () => no.click());
  expect(card()).toContain('Karte 1 von 4');
  await act(async () => no.click());
  expect(card()).toContain('Karte 2 von 4');
  await act(async () => root.unmount());
});
