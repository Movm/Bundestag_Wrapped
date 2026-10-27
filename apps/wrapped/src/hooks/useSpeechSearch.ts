import { useCallback, useEffect, useRef, useState } from 'react';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { SpeechSearchClient } from '@/lib/speech-search-client';
import type { SpeechSearchPage } from '@/lib/speech-search-protocol';
import type { SpeechSortOption } from '@/lib/search-utils';
import type { SearchState } from './useSearchState';

export function useSpeechSearch(state: SearchState, page: number, enabled: boolean) {
  const edition = useOptionalEdition();
  const manifestUrl = edition?.manifestUrl;
  const asset = edition?.manifest?.assets.speeches;
  const client = useRef<SpeechSearchClient | null>(null);
  const scope = JSON.stringify([manifestUrl, asset, state.q, state.party, state.minWords, state.maxWords, state.sort]);
  const key = JSON.stringify([scope, page]);
  const [result, setResult] = useState<{ key: string; scope: string; data?: SpeechSearchPage; error?: Error } | null>(null);

  // Changing edition or leaving the speech tab releases the entire corpus.
  useEffect(() => {
    if (!enabled || !manifestUrl || !asset) return;
    const instance = new SpeechSearchClient();
    client.current = instance;
    return () => { instance.dispose(); client.current = null; };
  }, [enabled, manifestUrl, asset]);

  useEffect(() => {
    if (!enabled || !manifestUrl || !asset || !client.current) return;
    let current = true;
    void client.current.request({ type: 'search', manifestUrl, asset, query: state.q,
      filters: { party: state.party, minWords: state.minWords || undefined, maxWords: state.maxWords || undefined },
      sort: state.sort as SpeechSortOption, page,
    }).then(response => {
      if (current && response.type === 'page') setResult({ key, scope, data: response.data });
    }).catch(error => { if (current) setResult({ key, scope, error: error instanceof Error ? error : new Error(String(error)) }); });
    return () => { current = false; };
  }, [enabled, manifestUrl, asset, key, scope, state.q, state.party, state.minWords, state.maxWords, state.sort, page]);

  const loadSpeech = useCallback(async (id: number) => {
    if (!client.current) throw new Error('Suchdienst nicht verfügbar');
    const response = await client.current.request({ type: 'detail', speechId: id });
    if (response.type !== 'detail') throw new Error('Ungültige Rede');
    return response.data;
  }, []);
  return {
    // Keep the current page in place until the next page arrives. Replacing it
    // with an empty list first causes two DOM/layout commits per navigation.
    data: enabled && result?.scope === scope ? result.data : undefined,
    error: enabled && result?.key === key ? result.error : undefined,
    isLoading: enabled && result?.key !== key,
    loadSpeech,
  };
}
