/**
 * Generate sitemap.xml for SEO
 * Includes published edition routes. Draft and preview editions are never indexed.
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://bundestag-wrapped.de';
// This value is intentionally stable: a build must not dirty a clean checkout.
const STATIC_LASTMOD = '2025-01-01';

const STATIC_PAGES = [
  { path: '/mcp', priority: '0.6', changefreq: 'monthly' },
  { path: '/mcp/technik', priority: '0.4', changefreq: 'monthly' },
  { path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function publishedEditions() {
  const publicDir = path.join(__dirname, '../public');
  const indexPath = path.join(publicDir, 'data/editions.json');
  if (!fs.existsSync(indexPath)) return [];
  const index = readJson(indexPath);
  return index.editions
    .filter((edition) => edition.status === 'published')
    .map((edition) => ({ ...edition, manifest: readJson(path.join(publicDir, edition.manifestUrl.replace(/^\//, ''))) }));
}

function resolveManifestAsset(manifestUrl, asset) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(manifestUrl.replace(/^\//, '')), asset));
}

function lastModified(manifest) {
  return manifest.generatedAt ? manifest.generatedAt.slice(0, 10) : STATIC_LASTMOD;
}

function getSpeakerSlugs(manifestUrl, manifest, publicDir) {
  const indexPath = path.join(publicDir, resolveManifestAsset(manifestUrl, manifest.assets.speakerIndex));
  if (!fs.existsSync(indexPath)) return [];
  const index = readJson(indexPath);
  return (index.speakers ?? []).map((speaker) => speaker.slug).filter(Boolean);
}

function generateSitemap() {
  const editions = publishedEditions();
  const publicDir = path.join(__dirname, '../public');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static pages
  for (const page of STATIC_PAGES) {
    xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${STATIC_LASTMOD}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  for (const edition of editions) {
    const base = `/${edition.id}`;
    const modified = lastModified(edition.manifest);
    for (const page of [
      { path: base, priority: '1.0', changefreq: 'weekly' },
      { path: `${base}/suche`, priority: '0.8', changefreq: 'weekly' },
      { path: `${base}/abgeordnete`, priority: '0.8', changefreq: 'weekly' },
      { path: `${base}/dokumentation`, priority: '0.6', changefreq: 'monthly' },
    ]) {
      xml += `  <url>\n    <loc>${SITE_URL}${page.path}</loc>\n    <lastmod>${modified}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }
    for (const slug of getSpeakerSlugs(edition.manifestUrl, edition.manifest, publicDir)) {
      xml += `  <url>\n    <loc>${SITE_URL}${base}/wrapped/${slug}</loc>\n    <lastmod>${modified}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }
  }

  xml += `</urlset>
`;

  return xml;
}

function main() {
  const sitemap = generateSitemap();
  const outputPath = path.join(__dirname, '../public/sitemap.xml');

  fs.writeFileSync(outputPath, sitemap);

  const editionCount = publishedEditions().length;
  const totalUrls = (sitemap.match(/<url>/g) ?? []).length;

  console.log(`Sitemap generated: ${outputPath}`);
  console.log(`  - Static pages: ${STATIC_PAGES.length}`);
  console.log(`  - Published editions: ${editionCount}`);
  console.log(`  - Total URLs: ${totalUrls}`);
}

main();
