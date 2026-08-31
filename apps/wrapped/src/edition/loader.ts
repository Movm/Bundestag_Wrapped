import { validateContractDocument, validateWrappedData } from '@/data/wrapped-contract';
import type { WrappedData } from '@/data/wrapped';
import type { Edition, EditionRegistry } from './registry';

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return response.json();
}

export async function loadRegistry(): Promise<EditionRegistry> {
  return validateContractDocument('EditionsIndex', await fetchJson('/data/editions.json'), '/data/editions.json');
}

export async function loadManifest(url: string): Promise<Edition> {
  return validateContractDocument('EditionManifest', await fetchJson(url), url);
}

export async function loadEditionWrapped(manifestUrl: string, manifest: Edition): Promise<WrappedData> {
  const url = new URL(manifest.assets.wrapped, new URL('.', window.location.origin + manifestUrl)).pathname;
  return validateWrappedData(await fetchJson(url), url);
}
