#!/usr/bin/env node
// Every root-relative data/asset path must go through assetUrl(...) so the same
// code works in the browser (unchanged) and embedded in the app (site origin).

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const literal = /(['"`])\/(?:data|sounds|fonts|icons|images|cover-adler|logo|speaker-enrichment)[/.]/;

const allowed = new Map([
  // Runs only in the browser (inlined by Vite into index.html); it never sees the app.
  ['src/cover/boot.ts', 'browser-only boot script, inlined by Vite'],
  // Constants that assetUrl() wraps at the point of use (it needs configureSite first, not at module load).
  ['src/cover/shell.ts', 'EAGLE_SRC is wrapped in acquireCover()'],
  ['src/shared/sounds/types.ts', 'SOUND_FILES are wrapped in lib/sounds.ts'],
  ['src/shared/theme-music/types.ts', 'TRACKS paths are wrapped in lib/theme-music.ts'],
  // Generated from the TRACKS table.
  ['src/generated', 'generated files'],
]);
// Workers and the static search engine run without configureSite and are not part of the app.
const skipPatterns = [/\.test\.tsx?$/, /\.d\.ts$/, /^src\/workers\//];

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(file);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [file] : [];
  });
}

// A literal is fine inside an `assetUrl(` call on the same line, or when the line says why not (`asset-path-ok`).
function isWrapped(line, index) {
  if (line.includes('asset-path-ok')) return true;
  const before = line.slice(0, index);
  const open = before.lastIndexOf('assetUrl(');
  return open !== -1 && !before.slice(open).includes(')');
}

const matches = files(src).flatMap((file) => {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (skipPatterns.some((p) => p.test(rel))) return [];
  if ([...allowed.keys()].some((a) => rel === a || rel.startsWith(`${a}/`))) return [];
  return fs.readFileSync(file, 'utf8').split('\n').flatMap((line, i) => {
    const m = literal.exec(line);
    return m && !isWrapped(line, m.index) ? [`${rel}:${i + 1}: ${line.trim()}`] : [];
  });
});

if (matches.length) {
  console.error(`Absolute asset path check failed (wrap in assetUrl() from @/lib/site):\n${matches.join('\n')}`);
  process.exit(1);
}

console.log('Absolute asset path check passed.');
