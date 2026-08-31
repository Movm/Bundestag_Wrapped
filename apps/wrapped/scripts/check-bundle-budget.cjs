/**
 * Deterministic production-bundle budget. This intentionally measures emitted
 * files rather than Lighthouse: it is stable in CI and catches accidental
 * imports of large route dependencies on the initial page.
 */
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '../dist');
const manifestPath = path.join(dist, '.vite/manifest.json');
const MAX_INITIAL_JS_BYTES = 1024 * 1024;
const MAX_INITIAL_CSS_BYTES = 150 * 1024;

function fileSize(relativePath) {
  return fs.statSync(path.join(dist, relativePath)).size;
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Missing Vite manifest. Run the production build before checking the bundle budget.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
if (!entry) throw new Error('Unable to find the application entry in the Vite manifest.');

const chunks = new Map();
function addChunk(chunk) {
  if (!chunk || chunks.has(chunk.file)) return;
  chunks.set(chunk.file, chunk);
  for (const imported of chunk.imports ?? []) addChunk(manifest[imported]);
}
addChunk(entry);

const initialJsBytes = [...chunks.values()].reduce((total, chunk) => total + fileSize(chunk.file), 0);
const initialCssBytes = [...new Set([...chunks.values()].flatMap((chunk) => chunk.css ?? []))]
  .reduce((total, file) => total + fileSize(file), 0);

console.log(`Initial JS: ${(initialJsBytes / 1024).toFixed(1)} KiB (budget: ${MAX_INITIAL_JS_BYTES / 1024} KiB)`);
console.log(`Initial CSS: ${(initialCssBytes / 1024).toFixed(1)} KiB (budget: ${MAX_INITIAL_CSS_BYTES / 1024} KiB)`);

if (initialJsBytes > MAX_INITIAL_JS_BYTES || initialCssBytes > MAX_INITIAL_CSS_BYTES) {
  process.exitCode = 1;
}
