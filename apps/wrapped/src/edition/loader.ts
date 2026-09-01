import { validateContractDocument, validateEditionContent, validateWrappedData } from '@/data/wrapped-contract';
import type { WrappedData } from '@/data/wrapped';
import { resolveAssetUrl, type Edition, type EditionRegistry } from './registry';
import type { EditionContent, EditionSummary } from '@/generated/wrapped-contract-v1';

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

async function fetchJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new EditionLoadError('network', `Network error while loading ${url}`, url);
  }
  if (!response.ok) {
    const kind = response.status === 404 ? 'missing-asset' : 'http';
    throw new EditionLoadError(kind, `${url}: ${response.status} ${response.statusText}`, url);
  }
  try {
    return await response.json();
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

export async function loadEditionAsset<T>(manifestUrl: string, asset: string): Promise<T> {
  return fetchJson(resolveAssetUrl(manifestUrl, asset)) as Promise<T>;
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
