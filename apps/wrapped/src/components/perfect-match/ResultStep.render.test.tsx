import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureSite } from '@/lib/site';
import type { MatchResult } from '@/lib/perfect-match';
import { ResultStep } from './ResultStep';

vi.mock('@/hooks/useDataQueries', () => ({ useSpeakerPortraits: () => ({}) }));

const matches: MatchResult[] = [{ slug: 'max-muster', name: 'Max Muster', party: 'GRÜNE', pct: 91, animal: null, reasons: [] }];
let container: HTMLDivElement;
let root: Root;
let share: ReturnType<typeof vi.fn>;

beforeEach(() => {
  share = vi.fn(async () => undefined);
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  configureSite({ embedded: false });
});

async function shareResult() {
  await act(async () => root.render(
    <MemoryRouter initialEntries={['/2026/perfect-match?x=1']}>
      <ResultStep matches={matches} profileUrl={slug => `/2026/abgeordnete/${slug}`} onRestart={() => {}} />
    </MemoryRouter>,
  ));
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === 'Ergebnis teilen');
  await act(async () => { button?.click(); });
}

describe('ResultStep share url', () => {
  it('shares the page url in the browser', async () => {
    await shareResult();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: window.location.href }));
  });

  it('shares the site url of the router path when embedded', async () => {
    configureSite({ embedded: true });
    await shareResult();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://bundestag-wrapped.de/2026/perfect-match?x=1' }));
  });
});
