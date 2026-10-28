import { validateContractDocument, validateEditionContent, validateWrappedData } from '@/data/wrapped-contract';
import type { WrappedData } from '@/data/wrapped';
import type { SpeakerIndex, SpeakerWrapped } from '@/data/speaker-wrapped';
import type { Speech, TopicRankingsData } from '@/lib/search-utils';
import { resolveAssetUrl, type Edition, type EditionRegistry } from './registry';
import type { EditionContent, EditionSummary, WordsAsset, WordRankingsAsset } from '@/generated/wrapped-contract-v1';

export type EditionLoadErrorKind = 'unknown-edition' | 'invalid-contract' | 'missing-asset' | 'http' | 'network';

export class EditionLoadError extends Error {
  readonly kind: EditionLoadErrorKind;
  readonly url?: string;

  constructor(
    kind: EditionLoadErrorKind,
    message: string,
    url?: string,
  ) {
    super(message);
    this.name = 'EditionLoadError';
    this.kind = kind;
    this.url = url;
  }
}

export interface SpeechesData {
  speeches: Speech[];
}

export type EditionAssetDocument =
  | 'SpeakerIndexAsset'
  | 'SpeakerWrappedAsset'
  | 'SpeechesAsset'
  | 'WordsAsset'
  | 'WordRankingsAsset'
  | 'TopicRankingsAsset';

type EditionAssetData = {
  SpeakerIndexAsset: SpeakerIndex;
  SpeakerWrappedAsset: SpeakerWrapped;
  SpeechesAsset: SpeechesData;
  WordsAsset: WordsAsset;
  WordRankingsAsset: WordRankingsAsset;
  TopicRankingsAsset: TopicRankingsData;
};

export interface EditionAssetTiming {
  headersMs?: number;
  bodyMs?: number;
  jsonMs?: number;
  validationMs?: number;
  encodedBytes?: number;
  decodedBytes?: number;
  contentEncoding?: string | null;
}

async function fetchJson(url: string, timing?: EditionAssetTiming): Promise<unknown> {
  // Edition documents are static, root-relative JSON resources under /data/.
  // Validate the raw path before fetch: no hostnames, encoded separators,
  // dot-only traversal segments, query strings or fragments can reach an API.
  if (!/^\/data\/(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.json$/.test(url)) {
    throw new EditionLoadError('invalid-contract', 'Untrusted edition asset URL', url);
  }
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(url, { redirect: 'error' });
  } catch {
    throw new EditionLoadError('network', `Network error while loading ${url}`, url);
  }
  if (!response.ok) {
    const kind = response.status === 404 ? 'missing-asset' : 'http';
    throw new EditionLoadError(kind, `${url}: ${response.status} ${response.statusText}`, url);
  }
  try {
    if (!timing) return await response.json();
    const headersAt = performance.now();
    const text = await response.text();
    const bodyAt = performance.now();
    const payload: unknown = JSON.parse(text);
    timing.headersMs = headersAt - started;
    timing.bodyMs = bodyAt - headersAt;
    timing.jsonMs = performance.now() - bodyAt;
    timing.contentEncoding = response.headers.get('content-encoding');
    const resource = performance.getEntriesByName(new URL(url, globalThis.location.href).href).at(-1) as PerformanceResourceTiming | undefined;
    timing.encodedBytes = resource?.encodedBodySize;
    timing.decodedBytes = resource?.decodedBodySize;
    return payload;
  } catch {
    throw new EditionLoadError('invalid-contract', `${url}: invalid JSON`, url);
  }
}

function validate<T>(fn: () => T, filename: string): T {
  try {
    return fn();
  } catch (error) {
    throw new EditionLoadError(
      'invalid-contract',
      error instanceof Error ? error.message : `Invalid contract document: ${filename}`,
      filename,
    );
  }
}

export async function loadRegistry(): Promise<EditionRegistry> {
  const url = '/data/editions.json';
  const payload = await fetchJson(url);
  return validate(() => validateContractDocument<EditionRegistry>('EditionsIndex', payload, url), url);
}

export async function loadManifest(url: string): Promise<Edition> {
  const payload = await fetchJson(url);
  return validate(() => validateContractDocument<Edition>('EditionManifest', payload, url), url);
}

export async function loadEditionContent(manifestUrl: string, manifest: Edition): Promise<EditionContent> {
  const url = resolveAssetUrl(manifestUrl, manifest.content);
  const payload = await fetchJson(url);
  return validate(() => validateEditionContent(payload, url), url);
}

export async function loadEditionWrapped(manifestUrl: string, manifest: Edition): Promise<WrappedData> {
  const url = resolveAssetUrl(manifestUrl, manifest.assets.wrapped);
  const payload = await fetchJson(url);
  return validate(() => validateWrappedData(payload, url), url);
}

export async function loadEditionAsset<Document extends EditionAssetDocument>(
  manifestUrl: string,
  asset: string,
  document: Document,
  timing?: EditionAssetTiming,
): Promise<EditionAssetData[Document]> {
  const url = resolveAssetUrl(manifestUrl, asset);
  const payload = await fetchJson(url, timing);
  const started = performance.now();
  const result = validate(() => validateContractDocument<EditionAssetData[Document]>(document, payload, url), url);
  if (timing) timing.validationMs = performance.now() - started;
  return result;
}

export function assertEditionConsistency(
  summary: EditionSummary,
  manifest: Edition,
  content: EditionContent,
): void {
  if (summary.id !== manifest.editionId || summary.year !== manifest.year) {
    throw new EditionLoadError('invalid-contract', `Edition index and manifest disagree for ${summary.id}`);
  }
  if (content.editionId !== manifest.editionId || content.year !== manifest.year) {
    throw new EditionLoadError('invalid-contract', `Edition content and manifest disagree for ${manifest.editionId}`);
  }
}
