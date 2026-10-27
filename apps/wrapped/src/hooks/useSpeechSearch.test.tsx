import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import type { SpeechSearchResponse } from '@/lib/speech-search-protocol';

const mocks = vi.hoisted(() => ({
  edition: { manifestUrl: '/data/a/manifest.json', manifest: { assets: { speeches: 'speeches.json' } } },
  pending: [] as { resolve: (value: SpeechSearchResponse) => void }[],
  dispose: vi.fn(),
}));
vi.mock('@/edition/EditionProvider', () => ({ useOptionalEdition: () => mocks.edition }));
vi.mock('@/lib/speech-search-client', () => ({ SpeechSearchClient: class {
  dispose = mocks.dispose;
  request() { return new Promise<SpeechSearchResponse>(resolve => mocks.pending.push({ resolve })); }
} }));
import { useSpeechSearch } from './useSpeechSearch';

it('ignores stale replies and releases the corpus on edition changes', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  function Probe({ query, page = 0 }: { query: string; page?: number }) {
    const result = useSpeechSearch({ q: query, tab: 'speeches', sort: 'relevance', party: '', minWords: 0, maxWords: 0 }, page, true);
    return <span data-loading={result.isLoading}>{result.data?.total ?? 'loading'}</span>;
  }
  try {
    await act(async () => root.render(<Probe query="alt" />));
    await act(async () => root.render(<Probe query="neu" />));
    await act(async () => mocks.pending[1].resolve({ id: 2, type: 'page', data: { items: [], total: 42 } }));
    expect(container.textContent).toBe('42');
    await act(async () => mocks.pending[0].resolve({ id: 1, type: 'page', data: { items: [], total: 999 } }));
    expect(container.textContent).toBe('42');
    await act(async () => root.render(<Probe query="neu" page={1} />));
    expect(container.textContent).toBe('42');
    expect(container.querySelector('span')!.dataset.loading).toBe('true');
    await act(async () => mocks.pending[2].resolve({ id: 3, type: 'page', data: { items: [], total: 42 } }));
    expect(container.querySelector('span')!.dataset.loading).toBe('false');
    mocks.edition = { manifestUrl: '/data/b/manifest.json', manifest: { assets: { speeches: 'speeches.json' } } };
    await act(async () => root.render(<Probe query="neu" />));
    expect(container.textContent).toBe('loading');
    expect(mocks.dispose).toHaveBeenCalledOnce();
  } finally { await act(async () => root.unmount()); }
});
