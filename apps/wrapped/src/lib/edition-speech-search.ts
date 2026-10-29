import { EditionLoadError, fetchJson, loadEditionAsset, loadManifest, type EditionAssetTiming } from '@/edition/loader';
import { resolveAssetUrl } from '@/edition/registry';
import { SpeechSearchEngine } from './speech-search-engine';
import { MissingSearchIndexAsset, StaticSpeechSearchEngine } from './static-speech-search-engine';
import { parseStaticSpeechIndex } from './speech-index-model';
import { SPEECH_INDEX_VERSION } from './speech-index-format';
import { UnsupportedTextRanges } from './speech-text-ranges';
import type { SpeechSearchPage, SpeechSearchRequest } from './speech-search-protocol';

type Search = Extract<SpeechSearchRequest, { type: 'search' }>;
export type SpeechSearchBackend = 'index' | 'legacy' | 'legacy-fallback';
/** Origin compatibility fallback; a rejected range response is never consumed whole. */
export class EditionSpeechSearch {
  kind: SpeechSearchBackend;
  private backend: Promise<StaticSpeechSearchEngine | SpeechSearchEngine>;
  private legacy: () => Promise<SpeechSearchEngine>;
  constructor(initial: StaticSpeechSearchEngine | SpeechSearchEngine, legacy: () => Promise<SpeechSearchEngine>) {
    this.backend = Promise.resolve(initial); this.legacy = legacy;
    this.kind = initial instanceof StaticSpeechSearchEngine ? 'index' : 'legacy';
  }
  private async recover(current: typeof this.backend, ready: StaticSpeechSearchEngine | SpeechSearchEngine, error: unknown) {
    if (this.backend !== current) return this.backend;
    if (!(ready instanceof StaticSpeechSearchEngine) || !(error instanceof UnsupportedTextRanges || error instanceof MissingSearchIndexAsset || missing(error))) throw error;
    ready.dispose(); this.kind = 'legacy-fallback';
    const fallback = this.legacy().catch(error => {
      if (this.backend === fallback) { this.backend = Promise.resolve(ready); this.kind = 'index'; }
      throw error;
    });
    this.backend = fallback;
    return fallback;
  }
  async search(request: Search): Promise<SpeechSearchPage> {
    const current = this.backend, ready = await current;
    try { return await ready.search(request); }
    catch (error) { return (await this.recover(current, ready, error)).search(request); }
  }
  async detail(id: number) {
    const current = this.backend, ready = await current;
    try { return await ready.detail(id); }
    catch (error) { return (await this.recover(current, ready, error)).detail(id); }
  }
}
function missing(error: unknown): boolean { return error instanceof EditionLoadError && error.kind === 'missing-asset'; }
function checksum(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(value)) throw new Error('Invalid search source checksum');
  return value.toLowerCase();
}
export async function createEditionSpeechSearch(manifestUrl: string, asset: string, timing: EditionAssetTiming): Promise<{ engine: EditionSpeechSearch; engineMs: number }> {
  let engineMs = 0;
  const legacy = async () => {
    timing.assetKind = 'corpus';
    const data = await loadEditionAsset(manifestUrl, asset, 'SpeechesAsset', timing);
    const started = performance.now();
    const engine = new SpeechSearchEngine(data.speeches);
    engineMs = performance.now() - started;
    return engine;
  };
  const started = performance.now();
  let initial: StaticSpeechSearchEngine | undefined;
  try {
    const manifest = await loadManifest(manifestUrl);
    if (asset === manifest.assets.speeches) {
      const checksums: unknown = await fetchJson(resolveAssetUrl(manifestUrl, manifest.checksums));
      if (!checksums || typeof checksums !== 'object' || Array.isArray(checksums)) throw new Error('Invalid search checksums');
      const hashes = checksums as Record<string, unknown>;
      const manifestSha256 = checksum(hashes['manifest.json']), sourceSha256 = checksum(hashes[asset]);
      const parent = manifestUrl.split('/').slice(0, -2).join('/');
      const url = `${parent}/search-v${SPEECH_INDEX_VERSION}-${manifestSha256}-${sourceSha256}/index.json`;
      timing.assetKind = 'index';
      const payload = await fetchJson(url, timing);
      const validationStarted = performance.now();
      const index = parseStaticSpeechIndex(payload, { editionId: manifest.editionId, dataVersion: manifest.dataVersion, manifestSha256, sourceSha256 });
      timing.validationMs = performance.now() - validationStarted;
      const setupStarted = performance.now();
      initial = new StaticSpeechSearchEngine(index, url);
      engineMs = performance.now() - setupStarted;
    }
  } catch (error) { if (!missing(error)) throw error; }
  timing.bootstrapMs = performance.now() - started;
  const engine = new EditionSpeechSearch(initial ?? await legacy(), legacy);
  return { engine, engineMs };
}
