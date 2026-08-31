import {
  HeroSection,
  StatsBar,
  OverviewSection,
  ComingSoonSection,
  DocFooter,
} from './dokumentation';
import { SEO } from '@/components/seo/SEO';
import { PAGE_META } from '@/components/seo/constants';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

export function DokumentationPage() {
  const surface = editionSurface(useOptionalEdition());
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${surface.title} – Methodik und Dokumentation`,
    description: PAGE_META.documentation.description,
    author: {
      '@type': 'Person',
      name: 'Moritz Wachter',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bundestag Wrapped',
    },
    inLanguage: 'de-DE',
  };

  return (
    <>
      <SEO
        title={PAGE_META.documentation.title}
        description={PAGE_META.documentation.description}
        canonicalUrl={editionPath(surface, 'dokumentation')}
        structuredData={articleSchema}
      />
      <div className="min-h-screen bg-[#fafaf9] pt-14">
        <HeroSection />
        <StatsBar />
        <OverviewSection />
        <ComingSoonSection />
        <DocFooter />
      </div>
    </>
  );
}
