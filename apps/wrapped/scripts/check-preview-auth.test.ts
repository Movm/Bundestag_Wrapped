import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { checkPreviewAuth } from './check-preview-auth.mjs';

describe('protected preview nginx boundary', () => {
  it('protects the preview route and its raw data', () => {
    const appRoot = path.resolve(import.meta.dirname, '..');
    expect(checkPreviewAuth(appRoot)).toEqual(['2026']);
  });

  it('answers the data preflight before the gate and allows the X-Gartenzaun header', () => {
    const nginx = readFileSync(path.resolve(import.meta.dirname, '../nginx.conf'), 'utf8');
    const start = nginx.indexOf('location ^~ /data/2026/');
    const block = nginx.slice(start, nginx.indexOf('try_files', start));
    expect(block.indexOf('$request_method = OPTIONS')).toBeGreaterThan(-1);
    expect(block.indexOf('$request_method = OPTIONS')).toBeLessThan(block.indexOf('$preview_unlocked = 0'));
    expect(block).toContain('Access-Control-Allow-Headers "Range, X-Gartenzaun"');
    expect(block).toContain('Access-Control-Allow-Origin "*"');
  });

  it('the entrypoint writes a map that unlocks by cookie or by header', () => {
    // The script writes a fixed /tmp path; run it on a copy pointed at a temp dir.
    const dir = mkdtempSync(path.join(os.tmpdir(), 'gz-'));
    const script = readFileSync(path.resolve(import.meta.dirname, '../docker-entrypoint.d/40-preview-access.sh'), 'utf8').replaceAll('/tmp/preview-access.conf', `${dir}/pa.conf`);
    execFileSync('sh', ['-c', script], { env: { ...process.env, PREVIEW_ACCESS_CODE: ' Aigner ' } });
    const map = readFileSync(`${dir}/pa.conf`, 'utf8');
    expect(map).toContain('map $cookie_gartenzaun $preview_cookie_ok');
    expect(map).toContain('map $http_x_gartenzaun $preview_header_ok');
    expect(map).toContain('"00" 0;');
    expect(map.match(/"aigner" 1;/g)).toHaveLength(2);
  });
});
