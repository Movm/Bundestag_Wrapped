import { describe, expect, it } from 'vitest';
import fixture from '../../../../contracts/wrapped/fixtures/valid-manifest.json';
import wrapped from '../../public/wrapped.json';

import { validateContractDocument, validateWrappedData } from './wrapped-contract';

describe('Wrapped v1 contract', () => {
  it('accepts the valid manifest fixture', () => {
    expect(validateContractDocument('EditionManifest', fixture, 'manifest.json')).toEqual(fixture);
  });

  it('rejects missing required fields with a filename and JSON path', () => {
    const invalid: Record<string, unknown> = { ...fixture };
    Reflect.deleteProperty(invalid, 'title');
    expect(() => validateContractDocument('EditionManifest', invalid, 'manifest.json')).toThrow(
      'manifest.json/: must have required property',
    );
  });

  it('rejects invalid dates, unknown statuses, and wrong field types', () => {
    expect(() => validateContractDocument('EditionManifest', { ...fixture, status: 'unknown' }, 'manifest.json')).toThrow('status');
    expect(() => validateContractDocument('EditionManifest', { ...fixture, period: { ...fixture.period, start: '2026-99-99' } }, 'manifest.json')).toThrow('start');
    expect(() => validateContractDocument('EditionManifest', { ...fixture, year: '2026' }, 'manifest.json')).toThrow('year');
  });

  it('accepts the checked-in Wrapped production payload', () => {
    expect(validateWrappedData(wrapped, 'wrapped.json')).toEqual(wrapped);
  });
});
