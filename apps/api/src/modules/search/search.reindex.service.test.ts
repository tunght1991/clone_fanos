import assert from 'node:assert/strict';
import test from 'node:test';

import { SearchReindexService } from './search.reindex.service.js';
import type { SearchDocument } from './search.document.js';

function createDocument(id: string): SearchDocument {
  return {
    audiobookId: id,
    title: `Book ${id}`,
    description: null,
    authorId: 'author-1',
    authorName: 'Author',
    narratorIds: ['narrator-1'],
    narratorNames: ['Narrator'],
    categoryIds: ['category-1'],
    categoryNames: ['Category'],
    tagIds: ['tag-1'],
    tagNames: ['Tag'],
    coverImageAssetKey: null,
    premiumFlag: true,
    status: 'PUBLISHED',
    publishedAt: '2026-05-11T00:00:00.000Z',
    popularityScore: 10,
    languageCode: 'vi',
    searchableText: `book ${id} author narrator category tag`,
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  };
}

test('SearchReindexService bulk replaces the index with published documents', async () => {
  const documents = [createDocument('book-1'), createDocument('book-2')];
  const calls: SearchDocument[][] = [];

  const service = new SearchReindexService({
    documentSource: {
      async listPublishedSearchDocuments() {
        return documents;
      },
      async findPublishedSearchDocumentByAudiobookId() {
        return null;
      },
    },
    indexRepository: {
      async replaceAll(input, options) {
        calls.push(input);
        assert.equal(options?.indexName, 'audiobooks_v2');
        return {
          indexedCount: input.length,
          deletedCount: 0,
        };
      },
      async upsert() {
        throw new Error('not expected');
      },
      async deleteByIds() {
        throw new Error('not expected');
      },
    },
    aliasManager: {
      async createVersionedIndexName(baseIndexName) {
        assert.equal(baseIndexName, 'audiobooks');
        return 'audiobooks_v2';
      },
      async swapAliases(input) {
        assert.equal(input.activeIndexName, 'audiobooks_v2');
        return {
          activeIndexName: 'audiobooks_v2',
          previousIndexName: input.previousIndexName ?? 'audiobooks_v1',
        };
      },
      async rollbackLastSwap() {
        return {
          activeIndexName: 'audiobooks_v1',
          previousIndexName: 'audiobooks_v0',
        };
      },
      async describeState() {
        return {
          readAlias: 'audiobooks_read',
          writeAlias: 'audiobooks_write',
          activeIndexName: 'audiobooks_v2',
          previousIndexName: 'audiobooks_v1',
        };
      },
    },
  });

  const result = await service.reindexAllPublishedAudiobooks();

  assert.equal(result.indexedCount, 2);
  assert.equal(result.activeIndexName, 'audiobooks_v2');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].audiobookId, 'book-1');
});

test('SearchReindexService upserts a single published audiobook document', async () => {
  const document = createDocument('book-1');
  let upserted: SearchDocument[] = [];

  const service = new SearchReindexService({
    documentSource: {
      async listPublishedSearchDocuments() {
        return [];
      },
      async findPublishedSearchDocumentByAudiobookId() {
        return document;
      },
    },
    indexRepository: {
      async replaceAll() {
        throw new Error('not expected');
      },
      async upsert(input, options) {
        assert.equal(options?.indexName, 'audiobooks_write');
        upserted = input;
        return {
          indexedCount: input.length,
          deletedCount: 0,
        };
      },
      async deleteByIds() {
        throw new Error('not expected');
      },
    },
    aliasManager: {
      async createVersionedIndexName() {
        throw new Error('not expected');
      },
      async swapAliases() {
        throw new Error('not expected');
      },
      async rollbackLastSwap() {
        throw new Error('not expected');
      },
      async describeState() {
        return {
          readAlias: 'audiobooks_read',
          writeAlias: 'audiobooks_write',
          activeIndexName: 'audiobooks_v1',
          previousIndexName: null,
        };
      },
    },
  });

  const result = await service.reindexPublishedAudiobook('book-1');

  assert.equal(result.indexed, true);
  assert.equal(result.documentId, 'book-1');
  assert.equal(upserted[0].searchableText.includes('book book-1 author'), true);
});

test('SearchReindexService deletes stale index documents when the audiobook is not published', async () => {
  let deletedIds: string[] = [];

  const service = new SearchReindexService({
    documentSource: {
      async listPublishedSearchDocuments() {
        return [];
      },
      async findPublishedSearchDocumentByAudiobookId() {
        return null;
      },
    },
    indexRepository: {
      async replaceAll() {
        throw new Error('not expected');
      },
      async upsert() {
        throw new Error('not expected');
      },
      async deleteByIds(input) {
        deletedIds = input;
        return {
          indexedCount: 0,
          deletedCount: input.length,
        };
      },
    },
    aliasManager: {
      async createVersionedIndexName() {
        throw new Error('not expected');
      },
      async swapAliases() {
        throw new Error('not expected');
      },
      async rollbackLastSwap() {
        throw new Error('not expected');
      },
      async describeState() {
        return {
          readAlias: 'audiobooks_read',
          writeAlias: 'audiobooks_write',
          activeIndexName: 'audiobooks_v1',
          previousIndexName: null,
        };
      },
    },
  });

  const result = await service.reindexPublishedAudiobook('book-9');

  assert.equal(result.indexed, false);
  assert.equal(result.documentId, 'book-9');
  assert.deepEqual(deletedIds, ['book-9']);
});

test('SearchReindexService can rollback the last successful bulk swap', async () => {
  let rollbackCalled = false;

  const service = new SearchReindexService({
    documentSource: {
      async listPublishedSearchDocuments() {
        return [];
      },
      async findPublishedSearchDocumentByAudiobookId() {
        return null;
      },
    },
    indexRepository: {
      async replaceAll() {
        return { indexedCount: 0, deletedCount: 0 };
      },
      async upsert() {
        return { indexedCount: 0, deletedCount: 0 };
      },
      async deleteByIds() {
        return { indexedCount: 0, deletedCount: 0 };
      },
    },
    aliasManager: {
      async createVersionedIndexName() {
        return 'audiobooks_v2';
      },
      async swapAliases() {
        return {
          activeIndexName: 'audiobooks_v2',
          previousIndexName: 'audiobooks_v1',
        };
      },
      async rollbackLastSwap() {
        rollbackCalled = true;
        return {
          activeIndexName: 'audiobooks_v1',
          previousIndexName: 'audiobooks_v2',
        };
      },
      async describeState() {
        return {
          readAlias: 'audiobooks_read',
          writeAlias: 'audiobooks_write',
          activeIndexName: 'audiobooks_v2',
          previousIndexName: 'audiobooks_v1',
        };
      },
    },
  });

  const result = await service.rollbackLastSuccessfulBulkSwap();

  assert.equal(rollbackCalled, true);
  assert.equal(result.activeIndexName, 'audiobooks_v1');
});
