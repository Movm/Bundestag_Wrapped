import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { configureSite } from '@/lib/site';
import { onNativeMessage } from '@/lib/native-shell';
import { setPreviewCode } from '@/lib/preview-code';
import { registryQuery } from '@/edition/registryQuery';
import { isRetired, previewEditionId } from '@/edition/registry';
import {
  CurrentEditionRedirect,
  EditionDarkLayout,
  EditionMainRoute,
  PageLoader,
} from '@/routes/edition-routes';

const AbgeordnetePage = lazy(() => import('@/components/AbgeordnetePage').then(m => ({ default: m.AbgeordnetePage })));
const MdbQuizPage = lazy(() => import('@/components/mdb-profile/MdbQuizPage').then(m => ({ default: m.MdbQuizPage })));
const PerfectMatchPage = lazy(() => import('@/components/perfect-match/PerfectMatchPage').then(m => ({ default: m.PerfectMatchPage })));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 min - data is static
        gcTime: 30 * 60 * 1000, // 30 min cache retention
        retry: 1,
      },
    },
  });
}

/**
 * Deep link `bundestag-wrapped://zugang?code=…`: keep the code and load everything again. When the
 * front door shows the construction page (current edition retired), land on the preview edition
 * the code opens instead of staying there.
 */
function PreviewCodeLink() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const atFrontDoor = useRef(pathname === '/');
  useEffect(() => { atFrontDoor.current = pathname === '/'; }, [pathname]);

  useEffect(() => onNativeMessage('preview.code', message => {
    if (!setPreviewCode(message.code)) return;
    void (async () => {
      await queryClient.resetQueries();
      if (!atFrontDoor.current) return;
      try {
        const registry = await queryClient.fetchQuery(registryQuery);
        const preview = previewEditionId(registry);
        if (preview && isRetired(registry, registry.currentEdition)) navigate(`/${preview}`, { replace: true });
      } catch {
        // The index is unreachable: the front door shows its own error page.
      }
    })();
  }), [queryClient, navigate]);

  return null;
}

/** App entry: story, member list, quiz and perfect match only, no analytics. */
export default function WrappedAppRoot({ initialPath }: { initialPath: string }) {
  // Must run before the first render: data and asset paths resolve against the site origin.
  const [queryClient] = useState(() => {
    configureSite({ embedded: true });
    return createQueryClient();
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <MemoryRouter initialEntries={[initialPath]}>
          <PreviewCodeLink />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<CurrentEditionRedirect legacy={false} />} />
              <Route path="/:editionId" element={<EditionMainRoute />} />
              <Route path="/:editionId" element={<EditionDarkLayout />}>
                <Route path="abgeordnete" element={<AbgeordnetePage />} />
                <Route path="abgeordnete/:slug/quiz" element={<MdbQuizPage />} />
                <Route path="perfect-match" element={<PerfectMatchPage />} />
              </Route>
            </Routes>
          </Suspense>
        </MemoryRouter>
      </MotionConfig>
    </QueryClientProvider>
  );
}
