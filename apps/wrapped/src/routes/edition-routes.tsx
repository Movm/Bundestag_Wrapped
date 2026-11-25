import { lazy, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { DarkLayout, LightLayout } from '@/layouts/MainLayout';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { useMenuState } from '@/hooks/useMenuState';
import { EditionProvider, useEdition } from '@/edition/EditionProvider';
import { registryQuery } from '@/edition/registryQuery';
import { currentEditionPath, isRetired, resolveLegacyEditionPath } from '@/edition/registry';
import { dismissBootCover } from '@/cover/shell';
import { PreviewCodeGate } from '@/components/preview/PreviewCodeGate';
import { EditionLoadError } from '@/edition/loader';
import { isEmbedded } from '@/lib/site';
import { SKELETON_HTML } from '@/cover/skeleton';

const ConstructionPage = lazy(() => import('@/components/construction/ConstructionPage').then(m => ({ default: m.ConstructionPage })));
const MainWrappedPage = lazy(() => import('@/components/MainWrappedPage').then(m => ({ default: m.MainWrappedPage })));

/** Same placeholder index.html paints before the bundle (src/cover/skeleton.ts), so the hand-over does not jump. */
export function PageLoader() {
  // Static markup from our own module, no user content.
  return <div className="contents" dangerouslySetInnerHTML={{ __html: SKELETON_HTML }} />;
}

// Special wrapper for MainWrappedPage which manages its own header
export function MainWrappedRoute() {
  const { isOpen: isMenuOpen, toggle: toggleMenu, close: closeMenu } = useMenuState();

  const [restartKey, setRestartKey] = useState(0);
  const restart = useCallback(() => {
    setRestartKey(key => key + 1);
    requestAnimationFrame(() => document.getElementById('intro')?.focus({ preventScroll: true }));
  }, []);

  return (
    <>
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} variant="dark" onRestart={restart} />
      <MainWrappedPage key={restartKey} isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} onRestart={restart} />
    </>
  );
}

export function RedirectError({ message }: { message: string }) {
  useEffect(dismissBootCover, []);
  return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-400 mb-2">Fehler beim Laden</p>
        <p className="text-on-muted text-sm">{message}</p>
      </div>
    </div>
  );
}

export function CurrentEditionRedirect({ legacy }: { legacy: boolean }) {
  const location = useLocation();
  const registry = useQuery(registryQuery);

  if (registry.isLoading) return <PageLoader />;
  if (registry.error || !registry.data) return <RedirectError message={registry.error?.message ?? 'Editionsindex ist nicht verfügbar'} />;
  // The current edition was taken down and the next one is not public yet.
  if (isRetired(registry.data, registry.data.currentEdition)) return <ConstructionPage />;

  let target: string | null = null;
  let routeError: string | null = null;
  try {
    target = legacy
      ? resolveLegacyEditionPath(registry.data, location.pathname)
      : currentEditionPath(registry.data);
  } catch (error) {
    routeError = error instanceof Error ? error.message : 'Ungültiger Editionsindex';
  }

  if (routeError) return <RedirectError message={routeError} />;
  if (!target) return <RedirectError message={`Keine Editionsroute für ${location.pathname}`} />;
  return <Navigate replace to={`${target}${location.search}${location.hash}`} />;
}

export function ValidatedEdition({ children }: { children: ReactNode }) {
  const edition = useEdition();

  if (edition.isLoading) return <PageLoader />;
  if (edition.error instanceof EditionLoadError && edition.error.kind === 'unauthorized' && isEmbedded()) {
    return <PreviewCodeGate probePath={edition.error.url ?? null} onUnlocked={edition.retry} />;
  }
  if (edition.error || !edition.manifest || !edition.content || !edition.data) {
    return <RedirectError message={edition.error?.message ?? 'Edition ist nicht verfügbar'} />;
  }

  return children;
}

/** Routes of a superseded edition show the construction page instead of loading its data. */
export function OpenEdition({ editionId, children }: { editionId: string; children: ReactNode }) {
  const registry = useQuery(registryQuery);
  if (registry.isLoading) return <PageLoader />;
  if (registry.data && isRetired(registry.data, editionId)) return <ConstructionPage />;
  return children;
}

export function EditionMainRoute() {
  const { editionId = '' } = useParams();
  return (
    <OpenEdition editionId={editionId}>
      <EditionProvider editionId={editionId}>
        <ValidatedEdition><MainWrappedRoute /></ValidatedEdition>
      </EditionProvider>
    </OpenEdition>
  );
}

/**
 * The application shell (header and mobile menu) must share the validated
 * edition context with the page beneath it.  Keeping this at the annual route
 * boundary also means navigation and restart actions use the manifest's
 * dataVersion, not a route-derived placeholder.
 */
export function EditionDarkLayout() {
  const { editionId = '' } = useParams();
  return (
    <OpenEdition editionId={editionId}>
      <EditionProvider editionId={editionId}>
        <ValidatedEdition><DarkLayout /></ValidatedEdition>
      </EditionProvider>
    </OpenEdition>
  );
}

export function EditionLightLayout() {
  const { editionId = '' } = useParams();
  return (
    <OpenEdition editionId={editionId}>
      <EditionProvider editionId={editionId}>
        <ValidatedEdition><LightLayout /></ValidatedEdition>
      </EditionProvider>
    </OpenEdition>
  );
}
