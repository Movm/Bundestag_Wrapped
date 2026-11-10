import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  for (const id of protectedIds) {
    const requiredLocations = [
      `location = /${id}`,
      `location ^~ /${id}/`,
      `location ^~ /data/${id}/`,
    ];
    for (const location of requiredLocations) {
      const start = nginx.indexOf(location);
      const end = nginx.indexOf('}', start);
      const block = start >= 0 && end >= 0 ? nginx.slice(start, end) : '';
      const gate = location.includes('/data/') ? 'return 401;' : 'return 302 /zugang/';
      if (!block.includes('if ($preview_unlocked = 0)') || !block.includes(gate)) {
        throw new Error(`Protected preview ${id} is missing the password gate at ${location}`);
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
