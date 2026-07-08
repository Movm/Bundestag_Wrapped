import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { DarkLayout, LightLayout } from '@/layouts/MainLayout';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { useMenuState } from '@/hooks/useMenuState';
import { UmamiAnalytics } from '@/components/analytics/UmamiAnalytics';

// Critical path - keep eager
import { MainWrappedPage } from '@/components/MainWrappedPage';
import { SpeakerWrappedPage } from '@/components/SpeakerWrappedPage';

// Lazy-loaded routes for smaller initial bundle
const DatenschutzPage = lazy(() => import('@/components/DatenschutzPage').then(m => ({ default: m.DatenschutzPage })));
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

export default function App() {
  return (
    <BrowserRouter>
      <UmamiAnalytics />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Main page has special header behavior (scroll-based visibility) */}
          <Route path="/" element={<MainWrappedRoute />} />

          {/* Dark theme routes */}
          <Route element={<DarkLayout />}>
            <Route path="/wrapped/:slug" element={<SpeakerWrappedPage />} />
            <Route path="/suche" element={<SuchePage />} />
            <Route path="/reden" element={<SuchePage />} />
            <Route path="/abgeordnete" element={<AbgeordnetePage />} />
            <Route path="/abgeordnete/:slug" element={<MdbProfilePage />} />
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
            <Route path="/dokumentation" element={<DokumentationPage />} />
            <Route path="/mcp" element={<McpPage />} />
            <Route path="/mcp/technik" element={<McpTechnikPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
