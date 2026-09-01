import { describe, expect, it } from 'vitest';

import { editionAssetQueryKey } from './useDataQueries';

describe('edition asset query keys', () => {
  it('keeps identical speaker slugs isolated across editions and data versions', () => {
    const speakerSlug = 'shared-slug';
    const first = editionAssetQueryKey({ editionId: 'edition-a', manifest: { editionId: 'edition-a', dataVersion: 'v1' } }, 'speaker', speakerSlug);
    const second = editionAssetQueryKey({ editionId: 'edition-b', manifest: { editionId: 'edition-b', dataVersion: 'v2' } }, 'speaker', speakerSlug);

    expect(first).not.toEqual(second);
    expect(first).toEqual(['edition', 'edition-a', 'v1', 'speaker', speakerSlug]);
    expect(second).toEqual(['edition', 'edition-b', 'v2', 'speaker', speakerSlug]);
  });

  it('namespaces every manifest asset type with edition metadata', () => {
    const edition = { editionId: 'edition-b', manifest: { editionId: 'edition-b', dataVersion: 'v2' } };
    expect(editionAssetQueryKey(edition, 'speaker-index')).toEqual(['edition', 'edition-b', 'v2', 'speaker-index']);
    expect(editionAssetQueryKey(edition, 'speeches')).toEqual(['edition', 'edition-b', 'v2', 'speeches']);
    expect(editionAssetQueryKey(edition, 'words')).toEqual(['edition', 'edition-b', 'v2', 'words']);
    expect(editionAssetQueryKey(edition, 'word-rankings')).toEqual(['edition', 'edition-b', 'v2', 'word-rankings']);
    expect(editionAssetQueryKey(edition, 'topic-rankings')).toEqual(['edition', 'edition-b', 'v2', 'topic-rankings']);
  });
});
