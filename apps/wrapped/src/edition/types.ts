import type { WrappedData } from '@/data/wrapped';
import type { Edition } from './registry';

export interface EditionContextValue {
  editionId: string;
  manifest?: Edition;
  data?: WrappedData;
  error?: Error | null;
  isLoading: boolean;
}
