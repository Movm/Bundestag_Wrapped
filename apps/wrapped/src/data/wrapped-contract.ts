import type { ErrorObject } from 'ajv';
import type { EditionContent, WrappedData } from '@/generated/wrapped-contract-v1';

export type ContractDocument =
  | 'EditionsIndex'
  | 'EditionManifest'
  | 'EditionContent'
  | 'WrappedData'
  | 'SpeakerIndexAsset'
  | 'SpeakerWrappedAsset'
  | 'SpeechesAsset'
  | 'WordsAsset'
  | 'WordRankingsAsset'
  | 'TopicRankingsAsset'
  | 'MatchAsset';

function formatErrors(errors: ErrorObject[] | null | undefined, filename: string): string {
  return (errors ?? [])
    .map(error => `${filename}${error.instancePath || '/'}: ${error.message ?? error.keyword}`)
    .join('; ');
}

type Validators = typeof import('@/generated/wrapped-contract-validators');
let validatorsModule: Promise<Validators> | null = null;

/**
 * The compiled validators are large (all contract documents in one module), so
 * they load as their own chunk on first use instead of with the initial page.
 * Loaders call this before fetching so the chunk arrives alongside the data.
 */
export function loadContractValidators(): Promise<Validators> {
  validatorsModule ??= import('@/generated/wrapped-contract-validators').catch((error: unknown) => {
    validatorsModule = null;
    throw error;
  });
  return validatorsModule;
}

export async function validateContractDocument<T>(
  document: ContractDocument,
  payload: unknown,
  filename: string,
): Promise<T> {
  const validate = (await loadContractValidators())[document];
  if (!validate) throw new Error(`Wrapped contract definition is unavailable: ${document}`);
  if (!validate(payload)) throw new Error(`Invalid Wrapped contract data: ${formatErrors(validate.errors, filename)}`);
  return payload as T;
}

export function validateWrappedData(payload: unknown, filename: string): Promise<WrappedData> {
  return validateContractDocument<WrappedData>('WrappedData', payload, filename);
}

export function validateEditionContent(payload: unknown, filename: string): Promise<EditionContent> {
  return validateContractDocument<EditionContent>('EditionContent', payload, filename);
}
