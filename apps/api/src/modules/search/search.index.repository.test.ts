import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemorySearchAliasManager, NoopSearchIndexRepository, PostgresSearchDocumentSource } from './search.index.repository.js';

test('NoopSearchIndexRepository honors write options while counting documents', async () => {
  const repository = new NoopSearchIndexRepository();
  const result = await repository.replaceAll([{ audiobookId: 'book-1' } as never], {
    indexName: 'audiobooks_v2',
    refresh: true,
  });

  assert.equal(result.indexedCount, 1);
  assert.equal(result.deletedCount, 0);
});

test('InMemorySearchAliasManager increments versioned index names and swaps safely', async () => {
  const manager = new InMemorySearchAliasManager({
    readAlias: 'audiobooks_read',
    writeAlias: 'audiobooks_write',
    activeIndexName: 'audiobooks_v1',
    previousIndexName: null,
  });

  const next = await manager.createVersionedIndexName('audiobooks');
  assert.equal(next, 'audiobooks_v2');

  const swapped = await manager.swapAliases({
    activeIndexName: next,
    previousIndexName: 'audiobooks_v1',
  });

  assert.equal(swapped.activeIndexName, 'audiobooks_v2');
  assert.equal(swapped.previousIndexName, 'audiobooks_v1');

  const rolledBack = await manager.rollbackLastSwap();
  assert.equal(rolledBack.activeIndexName, 'audiobooks_v1');
  assert.equal(rolledBack.previousIndexName, 'audiobooks_v2');
});

test('PostgresSearchDocumentSource uses a deterministic tie-breaker for bulk reindex ordering', async () => {
  let capturedQuery = '';

  const source = new PostgresSearchDocumentSource({
    async query(text) {
      capturedQuery = text;
      return {
        rows: [
          {
            audiobookId: 'book-1',
            title: 'Atomic Habits',
            description: null,
            coverImageAssetKey: null,
            authorId: 'author-1',
            authorName: 'James Clear',
            narratorIds: [],
            narratorNames: [],
            categoryIds: [],
            categoryNames: [],
            tagIds: [],
            tagNames: [],
            premiumFlag: true,
            status: 'PUBLISHED',
            publishedAt: new Date('2026-05-11T00:00:00.000Z'),
            popularityScore: 1,
            languageCode: 'vi',
            createdAt: new Date('2026-05-11T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          },
        ],
      } as never;
    },
  } as never);

  const documents = await source.listPublishedSearchDocuments();

  assert.equal(documents.length, 1);
  assert.match(
    capturedQuery.replace(/\s+/g, ' '),
    /ORDER BY audiobooks\.published_at DESC NULLS LAST, audiobooks\.created_at DESC, audiobooks\.id ASC/,
  );
});
