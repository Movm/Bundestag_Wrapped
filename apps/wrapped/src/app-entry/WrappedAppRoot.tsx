import { lazy, Suspense, useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { configureSite } from '@/lib/site';
import { onNativeMessage } from '@/lib/native-shell';
import { setPreviewCode } from '@/lib/preview-code';
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

/** App entry: story, member list, quiz and perfect match only, no analytics. */
export default function WrappedAppRoot({ initialPath }: { initialPath: string }) {
  // Must run before the first render: data and asset paths resolve against the site origin.
  const [queryClient] = useState(() => {
    configureSite({ embedded: true });
    return createQueryClient();
  });

  // Deep link `bundestag-wrapped://zugang?code=…`: keep the code and load everything again.
  useEffect(() => onNativeMessage('preview.code', message => {
    if (setPreviewCode(message.code)) void queryClient.resetQueries();
  }), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <MemoryRouter initialEntries={[initialPath]}>
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
