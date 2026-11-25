import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { DarkLayout, LightLayout } from '@/layouts/MainLayout';
import { UmamiAnalytics } from '@/components/analytics/UmamiAnalytics';
import {
  CurrentEditionRedirect,
  EditionDarkLayout,
  EditionLightLayout,
  EditionMainRoute,
  PageLoader,
} from '@/routes/edition-routes';

const SpeakerWrappedPage = lazy(() => import('@/components/SpeakerWrappedPage').then(m => ({ default: m.SpeakerWrappedPage })));

// Lazy-loaded routes for smaller initial bundle
const DatenschutzPage = lazy(() => import('@/components/DatenschutzPage').then(m => ({ default: m.DatenschutzPage })));
const TermsPage = lazy(() => import('@/components/TermsPage').then(m => ({ default: m.TermsPage })));
const DokumentationPage = lazy(() => import('@/components/DokumentationPage').then(m => ({ default: m.DokumentationPage })));
const McpPage = lazy(() => import('@/components/McpPage').then(m => ({ default: m.McpPage })));
const McpTechnikPage = lazy(() => import('@/components/McpTechnikPage').then(m => ({ default: m.McpTechnikPage })));
const SuchePage = lazy(() => import('@/components/SuchePage').then(m => ({ default: m.SuchePage })));
const AbgeordnetePage = lazy(() => import('@/components/AbgeordnetePage').then(m => ({ default: m.AbgeordnetePage })));
const MdbProfilePage = lazy(() => import('@/components/MdbProfilePage').then(m => ({ default: m.MdbProfilePage })));
const MdbQuizPage = lazy(() => import('@/components/mdb-profile/MdbQuizPage').then(m => ({ default: m.MdbQuizPage })));
const PerfectMatchPage = lazy(() => import('@/components/perfect-match/PerfectMatchPage').then(m => ({ default: m.PerfectMatchPage })));

// Statistiken pages (overview + subpages) - TEMPORARILY DISABLED
// const StatistikenLayout = lazy(() => import('@/components/statistiken/StatistikenLayout').then(m => ({ default: m.StatistikenLayout })));
// const StatistikenOverviewPage = lazy(() => import('@/components/statistiken/StatistikenOverviewPage').then(m => ({ default: m.StatistikenOverviewPage })));
// const ParteienPage = lazy(() => import('@/components/statistiken/pages/ParteienPage'));
// const RednerInnenPage = lazy(() => import('@/components/statistiken/pages/RednerInnenPage'));
// const TonalitaetPage = lazy(() => import('@/components/statistiken/pages/TonalitaetPage'));
// const ZwischenrufePage = lazy(() => import('@/components/statistiken/pages/ZwischenrufePage'));
// const GeschlechtPage = lazy(() => import('@/components/statistiken/pages/GeschlechtPage'));
// const ThemenPage = lazy(() => import('@/components/statistiken/pages/ThemenPage'));

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
          </Route>

          <Route path="/:editionId" element={<EditionDarkLayout />}>
            <Route path="wrapped/:slug" element={<SpeakerWrappedPage />} />
            <Route path="suche" element={<SuchePage />} />
            <Route path="abgeordnete" element={<AbgeordnetePage />} />
            <Route path="abgeordnete/:slug" element={<MdbProfilePage />} />
            <Route path="abgeordnete/:slug/quiz" element={<MdbQuizPage />} />
            <Route path="perfect-match" element={<PerfectMatchPage />} />
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
          </Route>
          <Route path="/:editionId" element={<EditionLightLayout />}>
            <Route path="dokumentation" element={<DokumentationPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
