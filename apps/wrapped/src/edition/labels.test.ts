import { describe, expect, it } from 'vitest';
import { previewCoverageLabel } from './labels';

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
