import { describe, expect, it } from 'vitest';
import { RESERVED_ROUTES } from '@/edition/registry';
import app from '@/App.tsx?raw';
import editionRoutes from './edition-routes.tsx?raw';

/** First segment of every absolute `path="/x..."` declared in the route tree (commented-out routes count). */
function topLevelNames(source: string): string[] {
  return [...source.matchAll(/path="\/([^/":]+)/g)].map(m => m[1]);
}

describe('reserved routes', () => {
  it('lists every static top-level route of the web app, so none becomes an edition id', () => {
    const names = new Set([...topLevelNames(app), ...topLevelNames(editionRoutes)]);
    expect(names.size).toBeGreaterThan(5);
    expect([...names].filter(name => !RESERVED_ROUTES.has(name))).toEqual([]);
  });
});
