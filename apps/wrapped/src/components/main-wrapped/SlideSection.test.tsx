import { act, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { SlideSection } from './SlideSection';

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
