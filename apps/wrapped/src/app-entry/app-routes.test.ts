import { describe, expect, it } from 'vitest';
import { isAppRoute } from './app-routes';

describe('isAppRoute', () => {
  it.each(['/', '/2026', '/2026/abgeordnete', '/2026/abgeordnete/max-muster/quiz', '/2026/perfect-match', '/preview-2026', '/2026/'])('%s is an app route', p => expect(isAppRoute(p)).toBe(true));
  it.each(['/2026/abgeordnete/max-muster', '/2026/suche', '/2026/wrapped/max', '/dokumentation', '/mcp', '/datenschutz', '/terms'])('%s is not', p => expect(isAppRoute(p)).toBe(false));
});
