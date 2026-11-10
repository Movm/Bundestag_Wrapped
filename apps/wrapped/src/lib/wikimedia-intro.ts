import type { ProfileDescription } from '@/data/speaker-wrapped';

type WikimediaIntro = {
  text: string;
  sourceUrl: string;
  revision?: string;
  updatedAt?: string;
};

export function wikipediaTitleFromDescription(description?: ProfileDescription | null): string | null {
  if (!description?.sourceUrl.includes('wikipedia.org/wiki/')) return null;
  const title = description.sourceUrl.split('/wiki/')[1];
  return title ? decodeURIComponent(title).replace(/_/g, ' ') : null;
}

export async function fetchWikimediaIntro(title: string): Promise<WikimediaIntro> {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts|info',
    titles: title,
    explaintext: '1',
    exintro: '1',
    inprop: 'url',
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  const response = await fetch(`https://de.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Wikimedia summary failed: ${response.status}`);
  }

  const body = await response.json() as {
    query?: {
      pages?: Array<{
        extract?: string;
        fullurl?: string;
        lastrevid?: number;
        touched?: string;
      }>;
    };
  };
  const page = body.query?.pages?.[0];
  if (!page?.extract) {
    throw new Error(`No Wikimedia intro for ${title}`);
  }

  return {
    text: page.extract,
    sourceUrl: page.fullurl ?? `https://de.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
    revision: page.lastrevid ? String(page.lastrevid) : undefined,
    updatedAt: page.touched,
  };
}
