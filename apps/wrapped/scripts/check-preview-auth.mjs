import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function checkPreviewAuth(appRoot) {
  const registry = JSON.parse(readFileSync(path.join(appRoot, 'public/data/editions.json'), 'utf8'));
  const protectedIds = registry.editions
    .filter((edition) => edition.status === 'preview' && edition.access === 'basic-auth')
    .map((edition) => edition.id);
  const nginx = readFileSync(path.join(appRoot, 'nginx.conf'), 'utf8');

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
      if (!block.includes('auth_basic_user_file /tmp/preview.htpasswd')) {
        throw new Error(`Protected preview ${id} is missing nginx Basic Auth at ${location}`);
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
