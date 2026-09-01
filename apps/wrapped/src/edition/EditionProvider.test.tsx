import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useNavigate, useParams } from 'react-router';
import { afterEach, describe, it, vi } from 'vitest';

const loader = vi.hoisted(() => ({
  loadRegistry: vi.fn(),
  loadManifest: vi.fn(),
  loadEditionContent: vi.fn(),
  loadEditionWrapped: vi.fn(),
  assertEditionConsistency: vi.fn(),
  EditionLoadError: class EditionLoadError extends Error {},
}));

vi.mock('./loader', () => loader);

import { EditionProvider, useEdition } from './EditionProvider';

const registry = {
  schemaVersion: 1,
  currentEdition: 'edition-a',
  editions: [
    { id: 'edition-a', year: 2041, status: 'published', manifestUrl: '/fixtures/a/manifest.json' },
    { id: 'edition-b', year: 2042, status: 'preview', manifestUrl: '/fixtures/b/manifest.json' },
  ],
};

const manifestFor = (id: 'edition-a' | 'edition-b', year: number) => ({
  schemaVersion: 1,
  editionId: id,
  year,
  title: id,
  status: id === 'edition-a' ? 'published' : 'preview',
  period: { start: `${year}-01-01`, end: `${year}-12-31`, timezone: 'Europe/Berlin', wahlperioden: [1] },
  dataVersion: `${id}-v1`,
  generatedAt: `${year}-01-01T00:00:00Z`,
  coverage: { protocolCount: 1, firstProtocolDate: `${year}-01-01`, lastProtocolDate: `${year}-01-01`, complete: id === 'edition-a' },
  assets: { wrapped: 'wrapped.json', speakerIndex: 'speakers/index.json', speakersBase: 'speakers', speeches: 'speeches.json', words: 'words.json', wordRankings: 'word-rankings.json', topicRankings: 'topic_rankings.json' },
  content: 'content.json',
  checksums: 'checksums.json',
});

function EditionProbe() {
  const edition = useEdition();
  const navigate = useNavigate();
  const marker = (edition.data as { marker?: string } | undefined)?.marker ?? 'loading';
  return <button type="button" onClick={() => navigate('/edition-b')}>{`${edition.editionId}:${marker}`}</button>;
}

function EditionRoute() {
  const { editionId = '' } = useParams();
  return <EditionProvider editionId={editionId}><EditionProbe /></EditionProvider>;
}

async function waitForText(container: HTMLElement, text: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (container.textContent === text) return;
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
  throw new Error(`Timed out waiting for ${text}; found ${container.textContent}`);
}

async function waitFor(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (condition()) return;
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
  throw new Error('Timed out waiting for asynchronous edition load');
}

describe('EditionProvider route isolation', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    root?.unmount();
    container?.remove();
    root = null;
    container = null;
    vi.clearAllMocks();
  });

  it('does not render prior-edition data while a new edition route loads', async () => {
    loader.loadRegistry.mockResolvedValue(registry);
    loader.loadManifest.mockImplementation((url: string) => Promise.resolve(url.includes('/a/') ? manifestFor('edition-a', 2041) : manifestFor('edition-b', 2042)));
    loader.loadEditionContent.mockImplementation((_url: string, manifest: { editionId: string; year: number }) => Promise.resolve({ editionId: manifest.editionId, year: manifest.year }));
    let resolveSecondEdition: ((value: unknown) => void) | undefined;
    loader.loadEditionWrapped.mockImplementation((_url: string, manifest: { editionId: string }) => {
      if (manifest.editionId === 'edition-a') return Promise.resolve({ marker: 'edition-a' });
      return new Promise(resolve => { resolveSecondEdition = resolve; });
    });

    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root!.render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/edition-a']}>
            <Routes><Route path="/:editionId" element={<EditionRoute />} /></Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
    await waitForText(container, 'edition-a:edition-a');

    await act(async () => {
      container!.querySelector('button')!.click();
    });
    await waitForText(container, 'edition-b:loading');
    await waitFor(() => Boolean(resolveSecondEdition));

    await act(async () => {
      resolveSecondEdition?.({ marker: 'edition-b' });
    });
    await waitForText(container, 'edition-b:edition-b');
  });
});
