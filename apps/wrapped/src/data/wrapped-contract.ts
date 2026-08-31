import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import contractSchema from '../generated/wrapped-contract-v1.schema.json';
import type { WrappedData } from '@/generated/wrapped-contract-v1';

export type ContractDocument = 'EditionsIndex' | 'EditionManifest' | 'WrappedData';

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(contractSchema);

function formatErrors(errors: ErrorObject[] | null | undefined, filename: string): string {
  return (errors ?? [])
    .map(error => `${filename}${error.instancePath || '/'}: ${error.message ?? error.keyword}`)
    .join('; ');
}

export function validateContractDocument<T>(
  document: ContractDocument,
  payload: unknown,
  filename: string,
): T {
  const validate = ajv.getSchema(`${contractSchema.$id}#/$defs/${document}`);
  if (!validate) throw new Error(`Wrapped contract definition is unavailable: ${document}`);
  if (!validate(payload)) throw new Error(`Invalid Wrapped contract data: ${formatErrors(validate.errors, filename)}`);
  return payload as T;
}

export function validateWrappedData(payload: unknown, filename: string): WrappedData {
  return validateContractDocument<WrappedData>('WrappedData', payload, filename);
}
