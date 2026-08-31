import { SITE_CONFIG } from './constants';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';

interface SEOProps {
  title?: string | null;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  structuredData?: object;
  twitterCard?: 'summary' | 'summary_large_image';
}

export function SEO({
  title,
  description = SITE_CONFIG.defaultDescription,
  canonicalUrl,
  ogImage = SITE_CONFIG.defaultOgImage,
  ogType = 'website',
  noIndex = false,
  structuredData,
  twitterCard = 'summary_large_image',
}: SEOProps) {
  const edition = useOptionalEdition();
  const surface = editionSurface(edition);
  const siteName = surface.title;
  const fullTitle = title
    ? `${title} | ${siteName}`
    : `${siteName} – Deine Bundestagsstatistiken`;

  const absoluteOgImage = ogImage.startsWith('http')
    ? ogImage
    : `${SITE_CONFIG.siteUrl}${ogImage}`;

  const absoluteCanonical = canonicalUrl
    ? `${SITE_CONFIG.siteUrl}${canonicalUrl}`
    : undefined;

  return (
    <>
      {/* Basic Meta Tags - React 19 hoists these to <head> automatically */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={absoluteCanonical ?? `${SITE_CONFIG.siteUrl}${surface.canonicalPath}`} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:url" content={absoluteCanonical ?? `${SITE_CONFIG.siteUrl}${surface.canonicalPath}`} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </>
  );
}
