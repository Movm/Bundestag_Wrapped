import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export const DEV_EDITIONS_URL_PREFIX = '/__dev-editions/';

export function devEditionsRoot(): string {
  return process.env.WRAPPED_DEV_EDITIONS_DIR
    ? path.resolve(process.env.WRAPPED_DEV_EDITIONS_DIR)
    : path.resolve(import.meta.dirname, '.dev-editions');
}

function safeFile(root: string, relative: string): string | null {
  if (!relative || relative.includes('\\')) return null;
  const segments = relative.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) return null;
  const file = path.resolve(root, ...segments);
  return file.startsWith(`${path.resolve(root)}${path.sep}`) ? file : null;
}

export function resolveDevEditionRequest(requestUrl: string, root = devEditionsRoot()): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }
  if (pathname === '/data/editions.json') return path.join(root, 'editions.json');
  if (!pathname.startsWith(DEV_EDITIONS_URL_PREFIX)) return null;
  return safeFile(root, pathname.slice(DEV_EDITIONS_URL_PREFIX.length));
}

function contentType(file: string): string {
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

/**
 * Exposes ignored local edition artifacts only through the Vite development
 * server. Production builds never execute configureServer and therefore never
 * see this directory or its local registry overlay.
 */
export function devEditionsPlugin(): Plugin {
  return {
    name: 'wrapped-dev-editions',
    apply: 'serve',
    configureServer(server) {
      const root = devEditionsRoot();
      server.middlewares.use((request, response, next) => {
        const file = resolveDevEditionRequest(request.url ?? '/', root);
        if (!file || !existsSync(file) || !statSync(file).isFile()) return next();

        response.statusCode = 200;
        response.setHeader('Content-Type', contentType(file));
        response.setHeader('Cache-Control', 'no-store');
        if (request.method === 'HEAD') return response.end();
        const stream = createReadStream(file);
        stream.on('error', next);
        stream.pipe(response);
      });
    },
  };
}
