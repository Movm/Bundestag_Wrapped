import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { ProgressSegments } from './ProgressSegments';
import { segmentFills } from '../progress';

it('is a progressbar named "Folie X von Y"', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<ProgressSegments index={4} count={48} surface="ink" />));
  const bar = container.querySelector('[role="progressbar"]')!;
  expect(bar.getAttribute('aria-valuetext')).toBe('Folie 5 von 48');
  expect(bar.getAttribute('aria-valuenow')).toBe('5');
  expect(bar.getAttribute('aria-valuemax')).toBe('48');
  expect(bar.querySelectorAll('.ds-progress__segment')).toHaveLength(10);
  await act(async () => root.unmount());
  container.remove();
});

it('fills segments proportionally and never exceeds 10 segments', () => {
  expect(segmentFills(0, 5)).toEqual([1, 0, 0, 0, 0]);
  expect(segmentFills(47, 48)).toEqual(Array(10).fill(1));
  expect(segmentFills(23, 48)).toHaveLength(10);
});
