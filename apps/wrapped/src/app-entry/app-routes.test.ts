import { afterEach, describe, expect, it } from 'vitest';
import { configureSite } from '@/lib/site';
import { appHas, isAppRoute } from './app-routes';

describe('isAppRoute', () => {
  it.each(['/', '/2026', '/2026/abgeordnete', '/2026/abgeordnete/max-muster/quiz', '/2026/perfect-match', '/preview-2026', '/2026/'])('%s is an app route', p => expect(isAppRoute(p)).toBe(true));
  it.each(['/2026/abgeordnete/max-muster', '/2026/suche', '/2026/wrapped/max', '/dokumentation', '/mcp', '/datenschutz', '/terms'])('%s is not', p => expect(isAppRoute(p)).toBe(false));
});

describe('appHas', () => {
  afterEach(() => configureSite({ embedded: false }));
  it('is always true in the browser', () => expect(appHas('/2026/suche')).toBe(true));
  it('follows the app routes when embedded', () => {
    configureSite({ embedded: true });
    expect(appHas('/2026/suche?tab=speakers')).toBe(false);
    expect(appHas('/2026/abgeordnete')).toBe(true);
    expect(appHas('/2026/abgeordnete#x')).toBe(true);
  });
});
