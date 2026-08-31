import { createContext, type ReactNode, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadEditionWrapped, loadManifest, loadRegistry } from './loader';
import { LEGACY_EDITION_ID } from './registry';
import type { EditionContextValue } from './types';

export type { EditionContextValue } from './types';

const EditionContext = createContext<EditionContextValue | null>(null);

export function EditionProvider({ editionId, children }: { editionId: string; children: ReactNode }) {
  const registry = useQuery({ queryKey: ['editions'], queryFn: loadRegistry, staleTime: Infinity });
  const summary = registry.data?.editions.find(item => item.id === editionId || (!editionId && item.id === registry.data?.currentEdition));
  const manifest = useQuery({ queryKey: ['edition', summary?.id, 'manifest'], queryFn: () => loadManifest(summary!.manifestUrl), enabled: Boolean(summary), staleTime: Infinity });
  const wrapped = useQuery({ queryKey: ['edition', manifest.data?.editionId, manifest.data?.dataVersion, 'wrapped'], queryFn: () => loadEditionWrapped(summary!.manifestUrl, manifest.data!), enabled: Boolean(summary && manifest.data), staleTime: Infinity });

  const error = registry.error ?? (summary ? manifest.error ?? wrapped.error : new Error(`Unknown edition: ${editionId}`));
  return <EditionContext.Provider value={{ editionId: editionId || LEGACY_EDITION_ID, manifest: manifest.data, data: wrapped.data, error, isLoading: registry.isLoading || manifest.isLoading || wrapped.isLoading }}>{children}</EditionContext.Provider>;
}

export function useEdition(): EditionContextValue {
  const value = useContext(EditionContext);
  if (!value) throw new Error('useEdition must be used inside EditionProvider');
  return value;
}

export function useOptionalEdition(): EditionContextValue | null {
  return useContext(EditionContext);
}
