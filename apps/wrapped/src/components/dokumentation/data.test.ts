import { describe, expect, it } from 'vitest';

import { buildDocumentationStats } from './data';

describe('buildDocumentationStats', () => {
  it('renders each annual documentation route from its own Wrapped payload and manifest', () => {
    const first = buildDocumentationStats(
      { metadata: { totalSpeeches: 1234, partyCount: 4, speakerCount: 80 } },
      12,
    );
    const second = buildDocumentationStats(
      { metadata: { totalSpeeches: 4321, partyCount: 5, speakerCount: 90 } },
      34,
    );

    expect(first).toEqual([
      { label: 'Beiträge analysiert', value: '1.234' },
      { label: 'Fraktionen', value: '4' },
      { label: 'Abgeordnete', value: '80' },
      { label: 'Protokolle', value: '12' },
    ]);
    expect(second).not.toEqual(first);
    expect(buildDocumentationStats(undefined, 12)).toEqual([]);
  });
});
