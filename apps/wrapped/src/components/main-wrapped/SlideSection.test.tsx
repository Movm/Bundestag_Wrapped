import { act, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { SlideSection } from './SlideSection';
import { StoryContext } from './StoryContext';
import { useSlideEffectsActive } from './SlideEffectsContext';

it('defers unseen slides, cleans hidden effects and preserves visited local state', async () => {
  const start = vi.fn();
  const stop = vi.fn();
  function Content() {
    const [count, setCount] = useState(0);
    useEffect(() => { start(); return stop; }, []);
    return <button onClick={() => setCount(n => n + 1)}>{count}</button>;
  }
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<SlideSection id="test" active={false}><Content /></SlideSection>));
    expect(container.querySelector('button')).toBeNull();
    await act(async () => root.render(<SlideSection id="test" active><Content /></SlideSection>));
    await act(async () => container.querySelector('button')!.click());
    expect(container.textContent).toBe('1');
    await act(async () => root.render(<SlideSection id="test" active={false}><Content /></SlideSection>));
    expect(stop).toHaveBeenCalledOnce();
    await act(async () => root.render(<SlideSection id="test" active><Content /></SlideSection>));
    expect(container.textContent).toBe('1');
    expect(start).toHaveBeenCalledTimes(2);
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('keeps neighbouring and reading-mode content rendered with only selected effects active', async () => {
  function Content() { return <output>{String(useSlideEffectsActive())}</output>; }
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const render = (activeId: string, readingMode: boolean) => root.render(
    <StoryContext value={{ activeId, readingMode }}>
      <SlideSection id="intro" active><Content /></SlideSection>
      <SlideSection id="next" active={false}><Content /></SlideSection>
    </StoryContext>,
  );
  try {
    await act(async () => render('next', false));
    expect(container.querySelector('#intro output')?.textContent).toBe('false');
    expect(container.querySelector('#next output')?.textContent).toBe('true');
    await act(async () => render('next', true));
    expect(container.querySelector('#intro output')?.textContent).toBe('false');
    expect(container.querySelector('#next output')?.textContent).toBe('true');
    expect(container.querySelector('#intro')?.hasAttribute('inert')).toBe(false);
    await act(async () => render('intro', true));
    expect(container.querySelector('#intro output')?.textContent).toBe('true');
    expect(container.querySelector('#next output')?.textContent).toBe('false');
  } finally { await act(async () => root.unmount()); container.remove(); }
});
