import { describe, expect, it } from 'vitest';
import { previewCoverageLabel, previewProtocolsLabel } from './labels';

const manifest = {
  status: 'preview',
  coverage: { lastProtocolDate: '2026-10-09' },
};

describe('previewCoverageLabel', () => {
  it('shows the actual last covered protocol date for previews', () => {
    expect(previewCoverageLabel(manifest as never)).toBe('Vorschau · Daten bis 09.10.2026');
  });

  it('does not label published or frozen editions as previews', () => {
    expect(previewCoverageLabel({ ...manifest, status: 'frozen' } as never)).toBeNull();
  });
});

describe('previewProtocolsLabel', () => {
  it('names the last protocol date in long form for previews', () => {
    expect(previewProtocolsLabel({ status: 'preview', coverage: { lastProtocolDate: '2026-11-06' } } as never)).toBe('Vorschau · Protokolle bis 6. November 2026');
  });

  it('stays silent for published or frozen editions', () => {
    expect(previewProtocolsLabel({ ...manifest, status: 'frozen' } as never)).toBeNull();
    expect(previewProtocolsLabel(undefined)).toBeNull();
  });
});
