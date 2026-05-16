import assert from 'node:assert/strict';
import test from 'node:test';

import { PostgresSearchRepository } from './search.repository.js';

test('PostgresSearchRepository maps search rows into audiobook-centric hits', async () => {
  let capturedQuery = '';
  let capturedParams: readonly unknown[] = [];

  const repository = new PostgresSearchRepository({
    async query(text, params) {
      capturedQuery = text;
      capturedParams = params ?? [];
      return {
        rows: [
          {
            audiobookId: 'book-1',
            title: 'Atomic Habit',
            coverImageAssetKey: 'covers/book-1.jpg',
            authorName: 'James Clear',
            narratorNames: ['Narrator 1'],
            categoryNames: ['Self Development'],
            tagNames: ['habit'],
            premiumFlag: true,
            status: 'published',
            score: 9.8,
            totalItems: 1,
          },
        ],
      } as never;
    },
  });

  const result = await repository.searchPublishedAudiobooks({
    query: 'habit',
    limit: 20,
    offset: 0,
    sortBy: 'RELEVANCE',
    sortOrder: 'DESC',
  });

  assert.ok(capturedQuery.includes('WITH filtered AS'));
  assert.equal(capturedParams[0], '%habit%');
  assert.equal(capturedParams[6], 20);
  assert.equal(capturedParams[7], 0);
  assert.equal(result.totalItems, 1);
  assert.equal(result.data[0].status, 'PUBLISHED');
  assert.equal(result.data[0].highlight?.title, 'Atomic <em>Habit</em>');
  assert.equal(result.data[0].narratorNames[0], 'Narrator 1');
  assert.equal(result.data[0].coverImageAssetKey, 'covers/book-1.jpg');
});
