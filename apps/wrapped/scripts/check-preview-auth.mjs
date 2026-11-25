import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The text of the location whose header starts at `start`, nested `if { }` blocks included. */
function locationBlock(source, start) {
  let depth = 0;
  for (let i = source.indexOf('{', start); i >= 0 && i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i);
  }
  return '';
}

/**
 * Every protected preview (registry `access: "basic-auth"`, kept as the contract
 * value) must sit behind the /zugang/ password gate: pages redirect, data 401s.
 */
export function checkPreviewAuth(appRoot) {
  const registry = JSON.parse(readFileSync(path.join(appRoot, 'public/data/editions.json'), 'utf8'));
  const protectedIds = registry.editions
    .filter((edition) => edition.status === 'preview' && edition.access === 'basic-auth')
    .map((edition) => edition.id);
  const nginx = readFileSync(path.join(appRoot, 'nginx.conf'), 'utf8');
  if (protectedIds.length && !nginx.includes('include /tmp/preview-access.conf;')) {
    throw new Error('nginx.conf does not include the preview access map');
  }
  const entrypoint = readFileSync(path.join(appRoot, 'docker-entrypoint.d/40-preview-access.sh'), 'utf8');
  if (protectedIds.length && !(entrypoint.includes('$cookie_gartenzaun') && entrypoint.includes('$http_x_gartenzaun'))) {
    throw new Error('The preview access map must accept the code as cookie and as X-Gartenzaun header');
  }

  for (const id of protectedIds) {
    const requiredLocations = [
      `location = /${id}`,
      `location ^~ /${id}/`,
      `location ^~ /data/${id}/`,
    ];
    for (const location of requiredLocations) {
      const start = nginx.indexOf(location);
      const block = start >= 0 ? locationBlock(nginx, start) : '';
      const gate = location.includes('/data/') ? 'return 401;' : 'return 302 /zugang/';
      if (!block.includes('if ($preview_unlocked = 0)') || !block.includes(gate)) {
        throw new Error(`Protected preview ${id} is missing the password gate at ${location}`);
      }
      // The app reads data cross-origin with an X-Gartenzaun header: CORS and an
      // ungated preflight must survive on the data location.
      if (location.includes('/data/') && !(block.includes('Access-Control-Allow-Origin') && block.includes('Range, X-Gartenzaun') && block.includes('return 204;'))) {
        throw new Error(`Protected preview ${id} is missing CORS and the X-Gartenzaun preflight at ${location}`);
      }
    }
  }
  return protectedIds;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) {
  const appRoot = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '..'));
  const ids = checkPreviewAuth(appRoot);
  console.log(`Preview auth check passed: ${ids.join(', ') || 'no previews'}`);
}
