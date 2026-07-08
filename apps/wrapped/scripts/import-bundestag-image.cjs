#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const [name, slug] = process.argv.slice(2);

if (!name || !slug) {
  console.error('Usage: node scripts/import-bundestag-image.cjs "Friedrich Merz" friedrich-merz');
  process.exit(1);
}

const BASE_URL = 'https://bilddatenbank.bundestag.de';

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
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
    url: imageUrl,
    thumbnailUrl,
    sourceUrl: new URL(linkMatch[1], BASE_URL).toString(),
    sourceLabel: 'Bundestag Bilddatenbank',
    imageNumber: linkMatch[2],
    photographer: photographer || undefined,
    credit: photographer ? `Deutscher Bundestag/${photographer}` : 'Deutscher Bundestag',
    caption: caption || `${name}, offizielles Foto aus der Bilddatenbank des Deutschen Bundestages.`,
    alt: `${name}, offizielles Foto aus der Bilddatenbank des Deutschen Bundestages.`,
    takenAt: takenAt || undefined,
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
  const outDir = path.join(process.cwd(), 'public', 'speaker-enrichment');
  const outFile = path.join(outDir, `${slug}.json`);

  await fs.mkdir(outDir, { recursive: true });

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
