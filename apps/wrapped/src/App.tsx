import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { DarkLayout, LightLayout } from '@/layouts/MainLayout';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { useMenuState } from '@/hooks/useMenuState';
import { UmamiAnalytics } from '@/components/analytics/UmamiAnalytics';
import { EditionProvider } from '@/edition/EditionProvider';
import { loadRegistry } from '@/edition/loader';
import { currentEditionPath, resolveLegacyEditionPath } from '@/edition/registry';

// Critical path - keep eager
import { MainWrappedPage } from '@/components/MainWrappedPage';
import { SpeakerWrappedPage } from '@/components/SpeakerWrappedPage';

// Lazy-loaded routes for smaller initial bundle
const DatenschutzPage = lazy(() => import('@/components/DatenschutzPage').then(m => ({ default: m.DatenschutzPage })));
const TermsPage = lazy(() => import('@/components/TermsPage').then(m => ({ default: m.TermsPage })));
const DokumentationPage = lazy(() => import('@/components/DokumentationPage').then(m => ({ default: m.DokumentationPage })));
const McpPage = lazy(() => import('@/components/McpPage').then(m => ({ default: m.McpPage })));
const McpTechnikPage = lazy(() => import('@/components/McpTechnikPage').then(m => ({ default: m.McpTechnikPage })));
const SuchePage = lazy(() => import('@/components/SuchePage').then(m => ({ default: m.SuchePage })));
const AbgeordnetePage = lazy(() => import('@/components/AbgeordnetePage').then(m => ({ default: m.AbgeordnetePage })));
const MdbProfilePage = lazy(() => import('@/components/MdbProfilePage').then(m => ({ default: m.MdbProfilePage })));

// Statistiken pages (overview + subpages) - TEMPORARILY DISABLED
// const StatistikenLayout = lazy(() => import('@/components/statistiken/StatistikenLayout').then(m => ({ default: m.StatistikenLayout })));
// const StatistikenOverviewPage = lazy(() => import('@/components/statistiken/StatistikenOverviewPage').then(m => ({ default: m.StatistikenOverviewPage })));
// const ParteienPage = lazy(() => import('@/components/statistiken/pages/ParteienPage'));
// const RednerInnenPage = lazy(() => import('@/components/statistiken/pages/RednerInnenPage'));
// const TonalitaetPage = lazy(() => import('@/components/statistiken/pages/TonalitaetPage'));
// const ZwischenrufePage = lazy(() => import('@/components/statistiken/pages/ZwischenrufePage'));
// const GeschlechtPage = lazy(() => import('@/components/statistiken/pages/GeschlechtPage'));
// const ThemenPage = lazy(() => import('@/components/statistiken/pages/ThemenPage'));

function PageLoader() {
  return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🏛️</div>
        <p className="text-white/60">Lade...</p>
      </div>
    </div>
  );
}

// Special wrapper for MainWrappedPage which manages its own header
function MainWrappedRoute() {
  const { isOpen: isMenuOpen, toggle: toggleMenu, close: closeMenu } = useMenuState();

  return (
    <>
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} variant="dark" />
      <MainWrappedPage isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
    </>
  );
}

function RedirectError({ message }: { message: string }) {
  return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-400 mb-2">Fehler beim Laden</p>
        <p className="text-white/40 text-sm">{message}</p>
      </div>
    </div>
  );
}

function CurrentEditionRedirect({ legacy }: { legacy: boolean }) {
  const location = useLocation();
  const registry = useQuery({ queryKey: ['editions'], queryFn: loadRegistry, staleTime: Infinity });

  if (registry.isLoading) return <PageLoader />;
  if (registry.error || !registry.data) return <RedirectError message={registry.error?.message ?? 'Editionsindex ist nicht verfügbar'} />;

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

function EditionMainRoute() {
  const { editionId = '' } = useParams();
  return <EditionProvider editionId={editionId}><MainWrappedRoute /></EditionProvider>;
}

function EditionSpeakerRoute() {
  const { editionId = '' } = useParams();
  return <EditionProvider editionId={editionId}><SpeakerWrappedPage /></EditionProvider>;
}

function EditionSucheRoute() {
  const { editionId = '' } = useParams();
  return <EditionProvider editionId={editionId}><SuchePage /></EditionProvider>;
}

function EditionAbgeordneteRoute() {
  const { editionId = '' } = useParams();
  return <EditionProvider editionId={editionId}><AbgeordnetePage /></EditionProvider>;
}

function EditionDokumentationRoute() {
  const { editionId = '' } = useParams();
  return <EditionProvider editionId={editionId}><DokumentationPage /></EditionProvider>;
}

function EditionMdbRoute() {
  const { editionId = '' } = useParams();
  return <EditionProvider editionId={editionId}><MdbProfilePage /></EditionProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <UmamiAnalytics />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Main page has special header behavior (scroll-based visibility) */}
          <Route path="/" element={<CurrentEditionRedirect legacy={false} />} />
          <Route path="/:editionId" element={<EditionMainRoute />} />

          {/* Dark theme routes */}
          <Route element={<DarkLayout />}>
            <Route path="/wrapped/:slug" element={<CurrentEditionRedirect legacy />} />
            <Route path="/suche" element={<CurrentEditionRedirect legacy />} />
            <Route path="/reden" element={<CurrentEditionRedirect legacy />} />
            <Route path="/abgeordnete" element={<CurrentEditionRedirect legacy />} />
            <Route path="/abgeordnete/:slug" element={<CurrentEditionRedirect legacy />} />
            <Route path="/:editionId/wrapped/:slug" element={<EditionSpeakerRoute />} />
            <Route path="/:editionId/suche" element={<EditionSucheRoute />} />
            <Route path="/:editionId/abgeordnete" element={<EditionAbgeordneteRoute />} />
            <Route path="/:editionId/abgeordnete/:slug" element={<EditionMdbRoute />} />
          </Route>

          {/* Statistiken routes - TEMPORARILY DISABLED
          <Route path="/statistiken" element={<StatistikenLayout />}>
            <Route index element={<StatistikenOverviewPage />} />
            <Route path="parteien" element={<ParteienPage />} />
            <Route path="redner_innen" element={<RednerInnenPage />} />
            <Route path="tonalitaet" element={<TonalitaetPage />} />
            <Route path="zwischenrufe" element={<ZwischenrufePage />} />
            <Route path="geschlecht" element={<GeschlechtPage />} />
            <Route path="themen" element={<ThemenPage />} />
          </Route>
          */}

          {/* Light theme routes */}
          <Route element={<LightLayout />}>
            <Route path="/datenschutz" element={<DatenschutzPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/dokumentation" element={<CurrentEditionRedirect legacy />} />
            <Route path="/mcp" element={<McpPage />} />
            <Route path="/mcp/technik" element={<McpTechnikPage />} />
            <Route path="/:editionId/dokumentation" element={<EditionDokumentationRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
