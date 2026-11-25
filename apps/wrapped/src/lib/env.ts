export interface WrappedEnv {
  DEV: boolean;
  PROD: boolean;
  VITE_UMAMI_URL?: string;
  VITE_UMAMI_WEBSITE_ID?: string;
  VITE_DEV_AUDIO?: string;
}

/** Vite inlines `import.meta.env`; under Metro it is undefined, so default to "neither dev nor prod". */
export function envFromMeta(meta: ImportMetaEnv | undefined): WrappedEnv {
  if (!meta) return { DEV: false, PROD: false };
  return {
    DEV: meta.DEV,
    PROD: meta.PROD,
    VITE_UMAMI_URL: meta.VITE_UMAMI_URL,
    VITE_UMAMI_WEBSITE_ID: meta.VITE_UMAMI_WEBSITE_ID,
    VITE_DEV_AUDIO: meta.VITE_DEV_AUDIO,
  };
}

export const env: WrappedEnv = envFromMeta(import.meta.env);
