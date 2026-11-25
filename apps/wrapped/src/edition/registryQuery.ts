import { loadRegistry } from './loader';

/**
 * Shared by every reader of the index. `retryOnMount: false`: a failed index is not re-fetched
 * each time another component mounts. Without it OpenEdition (shows the error, mounts
 * EditionProvider) and EditionProvider's own observer re-trigger the fetch, flip the query back
 * to pending, and the skeleton replaces the error page forever.
 */
export const registryQuery = { queryKey: ['editions'], queryFn: loadRegistry, staleTime: Infinity, retryOnMount: false } as const;
