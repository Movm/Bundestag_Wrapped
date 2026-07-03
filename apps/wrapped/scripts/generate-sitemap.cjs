/**
 * Generate sitemap.xml for SEO
 * Includes all static pages + dynamically generated speaker pages
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://bundestag-wrapped.de';
const TODAY = new Date().toISOString().split('T')[0];

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/suche', priority: '0.8', changefreq: 'weekly' },
  { path: '/abgeordnete', priority: '0.8', changefreq: 'weekly' },
  { path: '/dokumentation', priority: '0.6', changefreq: 'monthly' },
  { path: '/mcp', priority: '0.6', changefreq: 'monthly' },
  { path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
];

function getSpeakerSlugs() {
  const speakersDir = path.join(__dirname, '../public/speakers');
  const files = fs.readdirSync(speakersDir);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

function generateSitemap() {
  const speakerSlugs = getSpeakerSlugs();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static pages
  for (const page of STATIC_PAGES) {
    xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Speaker pages
  for (const slug of speakerSlugs) {
    xml += `  <url>
    <loc>${SITE_URL}/wrapped/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  xml += `</urlset>
`;

  return xml;
}

function main() {
  const sitemap = generateSitemap();
  const outputPath = path.join(__dirname, '../public/sitemap.xml');

  fs.writeFileSync(outputPath, sitemap);

  const speakerCount = getSpeakerSlugs().length;
  const totalUrls = STATIC_PAGES.length + speakerCount;

  console.log(`Sitemap generated: ${outputPath}`);
  console.log(`  - Static pages: ${STATIC_PAGES.length}`);
  console.log(`  - Speaker pages: ${speakerCount}`);
  console.log(`  - Total URLs: ${totalUrls}`);
}

main();
