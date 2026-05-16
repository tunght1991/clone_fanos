import assert from 'node:assert/strict';
import test from 'node:test';

import { SearchService } from './search.service.js';
import type { SearchRepositoryBundle } from './search.repository.js';

function createRepositoryBundle(): SearchRepositoryBundle {
  const calls: Array<{
    query: string;
    limit: number;
    offset: number;
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    narratorId?: string;
    premiumFlag?: boolean;
    sortBy: 'RELEVANCE' | 'CREATED_AT' | 'POPULARITY';
    sortOrder: 'ASC' | 'DESC';
  }> = [];

  const searchRepository = {
    calls,
    async searchPublishedAudiobooks(input) {
      calls.push(input);
      return {
        data: [
          {
            audiobookId: 'book-1',
            title: 'Atomic Habits',
            coverImageAssetKey: 'covers/book-1.jpg',
            authorName: 'James Clear',
            narratorNames: ['Narrator 1'],
            categoryNames: ['Self Development'],
            tagNames: ['habit'],
            premiumFlag: true,
            status: 'PUBLISHED',
            score: 9.8,
            highlight: {
              title: '<em>Habit</em>',
            },
          },
        ],
        totalItems: 1,
      };
    },
  };

  return {
    searchRepository,
  } as SearchRepositoryBundle;
}

test('SearchService normalizes query and pagination before delegating to the repository', async () => {
  const repositoryBundle = createRepositoryBundle();
  const service = new SearchService({
    repositories: repositoryBundle,
  });

  const result = await service.search({
    query: '  habit  ',
    page: 2,
    pageSize: 500,
    sortBy: 'RELEVANCE',
    sortOrder: 'DESC',
    premiumFlag: true,
    narratorId: 'narrator-1',
  });

  const repository = repositoryBundle.searchRepository as unknown as { calls: Array<{ query: string; limit: number; offset: number; premiumFlag?: boolean; narratorId?: string }> };
  assert.equal(repository.calls.length, 1);
  assert.equal(repository.calls[0].query, 'habit');
  assert.equal(repository.calls[0].limit, 100);
  assert.equal(repository.calls[0].offset, 100);
  assert.equal(repository.calls[0].premiumFlag, true);
  assert.equal(repository.calls[0].narratorId, 'narrator-1');
  assert.equal(result.meta.query, 'habit');
  assert.equal(result.meta.page, 2);
  assert.equal(result.meta.pageSize, 100);
  assert.equal(result.meta.totalItems, 1);
  assert.equal(result.meta.totalPages, 1);
  assert.equal(result.meta.hasNext, false);
  assert.equal(result.data[0].authorName, 'James Clear');
});

test('SearchService rejects empty query text', async () => {
  const service = new SearchService({
    repositories: createRepositoryBundle(),
  });

  await assert.rejects(
    () =>
      service.search({
        query: '   ',
        page: 1,
        pageSize: 20,
        sortBy: 'RELEVANCE',
        sortOrder: 'DESC',
      }),
    /query must not be empty/i,
  );
});
