import assert from 'node:assert/strict';
import test from 'node:test';

import { ContentController } from './content.controller.js';
import type { ContentService } from './content.service.js';

function createContentServiceStub(overrides: Partial<ContentService> = {}): ContentService {
  return {
    async listPublishedAudiobooks(params: { page: number; pageSize: number }) {
      return {
        data: [
          {
            id: 'book-1',
            title: 'Book 1',
            description: null,
            coverImageAssetKey: null,
            author: {
              id: 'author-1',
              name: 'Author 1',
            },
            durationSec: 1200,
            status: 'published',
            premiumFlag: true,
            languageCode: 'vi',
            publishedAt: null,
          },
        ],
        meta: {
          page: params.page,
          pageSize: params.pageSize,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
        },
      };
    },
    async getPublishedAudiobookDetail(audiobookId: string) {
      return audiobookId === 'book-1'
        ? {
            id: 'book-1',
            title: 'Book 1',
            description: 'Description',
            coverImageAssetKey: 'covers/book-1.jpg',
            author: {
              id: 'author-1',
              name: 'Author 1',
            },
            durationSec: 1200,
            status: 'published',
            premiumFlag: true,
            languageCode: 'vi',
            publishedAt: '2026-05-11T00:00:00.000Z',
            chapters: [],
            narrators: [],
          }
        : null;
    },
    async getPublishedAudioAssetAccessContext(audioAssetKey: string) {
      return audioAssetKey === 'audio/book-1/chapter-1.mp3'
        ? {
            audiobookId: 'book-1',
            audiobookStatus: 'published',
            chapterId: 'chapter-1',
            chapterStatus: 'published',
            premiumFlag: true,
          }
        : null;
    },
    ...overrides,
  } as ContentService;
}

test('ContentController normalizes list pagination before delegating to the service', async () => {
  const controller = new ContentController(createContentServiceStub());

  const result = await controller.listAudiobooks({ page: 2, pageSize: 500 });

  assert.equal(result.meta.page, 2);
  assert.equal(result.meta.pageSize, 100);
  assert.equal(result.data.length, 1);
});

test('ContentController falls back to default pagination when query is missing', async () => {
  const controller = new ContentController(createContentServiceStub());

  const result = await controller.listAudiobooks();

  assert.equal(result.meta.page, 1);
  assert.equal(result.meta.pageSize, 20);
  assert.equal(result.meta.totalItems, 1);
});

test('ContentController wraps audiobook detail in a data envelope', async () => {
  const controller = new ContentController(createContentServiceStub());

  const result = await controller.getAudiobookById('book-1');

  assert.ok(result);
  assert.equal(result?.data.id, 'book-1');
  assert.equal(result?.data.author.name, 'Author 1');
});

test('ContentController returns null when the audiobook is not found', async () => {
  const controller = new ContentController(createContentServiceStub());

  const result = await controller.getAudiobookById('missing');

  assert.equal(result, null);
});
