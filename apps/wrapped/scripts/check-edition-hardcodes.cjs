#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const targets = [path.join(root, 'src'), path.join(root, 'index.html'), path.join(root, 'vite.config.ts')];
const allowed = new Set([
  path.join(root, 'src/components/slides/ToneAnalysisSlide/LegacyResultView.tsx'),
]);
const forbidden = /(?:Bundestag Wrapped 2025|bundestag-wrapped-2025|\bWrapped 2025\b)/i;

function files(target) {
  if (fs.statSync(target).isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(target, entry.name);
    if (entry.isDirectory()) return files(file);
    return /\.(?:ts|tsx|html)$/.test(entry.name) ? [file] : [];
  });
}

const matches = targets.flatMap(files).filter((file) => !allowed.has(file)).flatMap((file) => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  return lines.flatMap((line, index) => forbidden.test(line) ? [`${path.relative(root, file)}:${index + 1}`] : []);
});

if (matches.length) {
  console.error(`Edition hardcode check failed:\n${matches.join('\n')}`);
  process.exit(1);
}

console.log('Edition hardcode check passed.');
