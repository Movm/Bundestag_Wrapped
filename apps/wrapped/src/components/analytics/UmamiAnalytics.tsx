import { useEffect } from 'react';

export function UmamiAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const url = import.meta.env.VITE_UMAMI_URL;
    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;

    if (!url || !websiteId) return;

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `${url}/script.js`;
    script.setAttribute('data-website-id', websiteId);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
