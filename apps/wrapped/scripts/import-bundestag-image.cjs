#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const [name, slug] = process.argv.slice(2);

if (!name || !slug) {
  console.error('Usage: node scripts/import-bundestag-image.cjs "Friedrich Merz" friedrich-merz');
  process.exit(1);
}

const BASE_URL = 'https://bilddatenbank.bundestag.de';
const OUT_DIR = path.resolve(process.cwd(), 'public', 'speaker-enrichment');

function validateSlug(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`Invalid slug "${value}". Use lowercase letters, numbers and hyphens only.`);
  }
  return value;
}

function outputFileForSlug(value) {
  const safeSlug = validateSlug(value);
  const file = path.resolve(OUT_DIR, `${safeSlug}.json`);
  if (!file.startsWith(`${OUT_DIR}${path.sep}`)) {
    throw new Error(`Refusing to write outside ${OUT_DIR}.`);
  }
  return file;
}

function decodeEntities(value) {
  const entities = {
    quot: '"',
    '#039': "'",
    amp: '&',
    lt: '<',
    gt: '>',
  };
  return value
    .replace(/&(quot|#039|amp|lt|gt);/g, (_, entity) => entities[entity])
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(value, fallback) {
  const text = String(value ?? fallback ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 500);
}

function cleanBundestagUrl(value) {
  const url = new URL(value, BASE_URL);
  if (url.origin !== BASE_URL) {
    throw new Error(`Unexpected Bilddatenbank URL origin: ${url.origin}`);
  }
  return url.toString();
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' '));
}

function pickLargestImage(srcset) {
  const candidates = srcset
    .split(',')
    .map((entry) => entry.trim().match(/(\S+)\s+(\d+)w/))
    .filter(Boolean)
    .map((match) => ({ url: match[1], width: Number(match[2]) }))
    .sort((a, b) => b.width - a.width);

  return candidates[0]?.url ? new URL(candidates[0].url, BASE_URL).toString() : null;
}

function matchText(html, pattern) {
  const match = html.match(pattern);
  return match ? stripTags(match[1]) : null;
}

function parseFirstImage(html) {
  const linkMatch = html.match(/href="(\/site\/picture-detail\?id=(\d+))"/);
  if (!linkMatch?.index) {
    throw new Error('No picture detail link found in Bilddatenbank result.');
  }

  const snippet = html.slice(Math.max(0, linkMatch.index - 5000), linkMatch.index + 12000);
  const srcset = matchText(snippet, /data-srcset="([^"]+)"/);
  const imageUrl = srcset ? pickLargestImage(srcset) : null;

  if (!imageUrl) {
    throw new Error(`No usable image srcset found for Bilddatenbank image ${linkMatch[2]}.`);
  }

  const thumbnailUrl = srcset
    ?.split(',')
    .map((entry) => entry.trim().match(/(\S+)\s+(\d+)w/))
    .filter(Boolean)
    .map((match) => ({ url: new URL(match[1], BASE_URL).toString(), width: Number(match[2]) }))
    .sort((a, b) => a.width - b.width)[0]?.url;

  const caption =
    matchText(snippet, /data-caption="([^"]+)"/) ||
    matchText(snippet, /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
  const photographer =
    matchText(snippet, /Fotograf\/in[\s\S]*?<dd[^>]*>([\s\S]*?)<\/dd>/) ||
    matchText(snippet, /Fotograf[\s\S]*?<dd[^>]*>([\s\S]*?)<\/dd>/);
  const takenAt =
    matchText(snippet, /Aufnahmedatum[\s\S]*?<dd[^>]*>([\s\S]*?)<\/dd>/) ||
    matchText(snippet, /Datum[\s\S]*?<dd[^>]*>([\s\S]*?)<\/dd>/);

  return {
    url: cleanBundestagUrl(imageUrl),
    thumbnailUrl: thumbnailUrl ? cleanBundestagUrl(thumbnailUrl) : undefined,
    sourceUrl: cleanBundestagUrl(linkMatch[1]),
    sourceLabel: 'Bundestag Bilddatenbank',
    imageNumber: linkMatch[2],
    photographer: photographer ? cleanText(photographer) : undefined,
    credit: photographer ? `Deutscher Bundestag/${cleanText(photographer)}` : 'Deutscher Bundestag',
    caption: cleanText(caption, `${name}, offizielles Foto aus der Bilddatenbank des Deutschen Bundestages.`),
    alt: cleanText(`${name}, offizielles Foto aus der Bilddatenbank des Deutschen Bundestages.`),
    takenAt: takenAt ? cleanText(takenAt) : undefined,
  };
}

async function main() {
  const searchUrl = new URL('/search/picture-result', BASE_URL);
  searchUrl.searchParams.set('query', name);

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`Bilddatenbank search failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const officialImage = parseFirstImage(html);
  const outFile = outputFileForSlug(slug);

  await fs.mkdir(OUT_DIR, { recursive: true });

  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(outFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.writeFile(outFile, `${JSON.stringify({ ...existing, officialImage }, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), outFile)} from ${officialImage.sourceUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
