import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const loader = vi.hoisted(() => ({
  loadRegistry: vi.fn(),
  loadManifest: vi.fn(),
  loadEditionContent: vi.fn(),
  loadEditionWrapped: vi.fn(),
  assertEditionConsistency: vi.fn(),
  loadErrorMessage: () => 'Fehlertext',
  EditionLoadError: class EditionLoadError extends Error {},
}));

vi.mock('./loader', () => loader);

import { EditionProvider, useEdition } from './EditionProvider';
import { LoadErrorPage } from '@/components/LoadErrorPage';

function Page() {
  const edition = useEdition();
  if (edition.error) return <LoadErrorPage error={edition.error} onRetry={edition.retry} />;
  return <p>{edition.data ? 'geladen' : 'laedt'}</p>;
}

const flush = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

describe('load error retry', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;
  afterEach(() => { root?.unmount(); container?.remove(); vi.clearAllMocks(); });

  it('shows the button on error; one click refetches once and the page renders', async () => {
    loader.loadRegistry.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({
      schemaVersion: 1, currentEdition: 'a', editions: [{ id: 'a', year: 2041, status: 'published', manifestUrl: '/a/manifest.json' }],
    });
    loader.loadManifest.mockResolvedValue({ editionId: 'a', dataVersion: 'v1' });
    loader.loadEditionContent.mockResolvedValue({});
    loader.loadEditionWrapped.mockResolvedValue({ marker: 'a' });

    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root!.render(<QueryClientProvider client={client}><MemoryRouter><EditionProvider editionId="a"><Page /></EditionProvider></MemoryRouter></QueryClientProvider>);
    });
    await flush();
    await flush();

    const button = container.querySelector('button');
    expect(button?.textContent).toBe('Erneut versuchen');
    expect(loader.loadRegistry).toHaveBeenCalledTimes(1);

    await act(async () => { button!.click(); });
    for (let i = 0; i < 8; i += 1) await flush();

    expect(loader.loadRegistry).toHaveBeenCalledTimes(2);
    expect(container.textContent).toBe('geladen');
  });
});
