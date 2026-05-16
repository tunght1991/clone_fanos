import assert from 'node:assert/strict';
import test from 'node:test';

import { SearchController } from './search.controller.js';
import type { SearchService } from './search.service.js';

function createSearchServiceStub(overrides: Partial<SearchService> = {}): SearchService {
  return {
    async search(input) {
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
          },
        ],
        meta: {
          query: input.query,
          page: input.page,
          pageSize: input.pageSize,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        },
      };
    },
    ...overrides,
  } as SearchService;
}

test('SearchController normalizes search filters before delegating to the service', async () => {
  const controller = new SearchController(createSearchServiceStub());

  const result = await controller.search({
    query: '  habit ',
    page: 2,
    pageSize: 500,
    premiumFlag: true,
    sortBy: 'POPULARITY',
    sortOrder: 'ASC',
  });

  assert.equal(result.meta.query, 'habit');
  assert.equal(result.meta.page, 2);
  assert.equal(result.meta.pageSize, 100);
  assert.equal(result.meta.sortBy, 'POPULARITY');
  assert.equal(result.meta.sortOrder, 'ASC');
});

test('SearchController rejects empty query text', async () => {
  const controller = new SearchController(createSearchServiceStub());

  await assert.rejects(
    () =>
      controller.search({
        query: '   ',
      }),
    /query must not be empty/i,
  );
});
