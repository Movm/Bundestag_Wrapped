import type { WrappedData } from '@/data/wrapped';
import type { Edition } from './registry';
import type { EditionContent } from '@/generated/wrapped-contract-v1';

export interface EditionContextValue {
  editionId: string;
  manifestUrl?: string;
  manifest?: Edition;
  content?: EditionContent;
  data?: WrappedData;
  error?: Error | null;
  isLoading: boolean;
  resolveAssetUrl: (asset: string) => string;
}
