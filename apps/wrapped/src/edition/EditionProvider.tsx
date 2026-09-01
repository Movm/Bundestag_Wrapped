import { createContext, type ReactNode, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assertEditionConsistency, EditionLoadError, loadEditionContent, loadEditionWrapped, loadManifest, loadRegistry } from './loader';
import { LEGACY_EDITION_ID, resolveAssetUrl } from './registry';
import type { EditionContextValue } from './types';

export type { EditionContextValue } from './types';

const EditionContext = createContext<EditionContextValue | null>(null);

export function EditionProvider({ editionId, children }: { editionId: string; children: ReactNode }) {
  const registry = useQuery({ queryKey: ['editions'], queryFn: loadRegistry, staleTime: Infinity });
  const summary = registry.data?.editions.find(item => item.id === editionId);
  const manifest = useQuery({ queryKey: ['edition', summary?.id, 'manifest'], queryFn: () => loadManifest(summary!.manifestUrl), enabled: Boolean(summary), staleTime: Infinity });
  const content = useQuery({
    queryKey: ['edition', manifest.data?.editionId, manifest.data?.dataVersion, 'content'],
    queryFn: () => loadEditionContent(summary!.manifestUrl, manifest.data!),
    enabled: Boolean(summary && manifest.data),
    staleTime: Infinity,
  });
  const consistencyError = summary && manifest.data && content.data
    ? (() => {
      try {
        assertEditionConsistency(summary, manifest.data, content.data);
        return null;
      } catch (error) {
        return error instanceof Error ? error : new EditionLoadError('invalid-contract', 'Invalid edition consistency');
      }
    })()
    : null;
  const wrapped = useQuery({
    queryKey: ['edition', manifest.data?.editionId, manifest.data?.dataVersion, 'wrapped'],
    queryFn: () => loadEditionWrapped(summary!.manifestUrl, manifest.data!),
    enabled: Boolean(summary && manifest.data && content.data && !consistencyError),
    staleTime: Infinity,
  });

  const error = registry.error ?? (summary
    ? manifest.error ?? content.error ?? consistencyError ?? wrapped.error
    : registry.data ? new EditionLoadError('unknown-edition', `Unknown edition: ${editionId}`) : null);
  const manifestUrl = summary?.manifestUrl;
  return <EditionContext.Provider value={{
    editionId: editionId || LEGACY_EDITION_ID,
    manifestUrl,
    manifest: manifest.data,
    content: content.data,
    data: wrapped.data,
    error,
    isLoading: registry.isLoading || manifest.isLoading || content.isLoading || wrapped.isLoading,
    resolveAssetUrl: (asset) => manifestUrl ? resolveAssetUrl(manifestUrl, asset) : asset,
  }}>{children}</EditionContext.Provider>;
}

export function useEdition(): EditionContextValue {
  const value = useContext(EditionContext);
  if (!value) throw new Error('useEdition must be used inside EditionProvider');
  return value;
}

export function useOptionalEdition(): EditionContextValue | null {
  return useContext(EditionContext);
}
