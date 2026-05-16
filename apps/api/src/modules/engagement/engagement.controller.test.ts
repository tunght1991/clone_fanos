import assert from 'node:assert/strict';
import test from 'node:test';

import { EngagementController } from './engagement.controller.js';
import type { EngagementService } from './engagement.service.js';

function createServiceStub(overrides: Partial<EngagementService> = {}): EngagementService {
  return {
    async createBookmark() {
      return {
        id: 'bookmark-1',
        audiobookId: 'book-1',
        audiobookTitle: 'Atomic Habits',
        audiobookCoverImageAssetKey: 'covers/book-1.jpg',
        authorName: 'James Clear',
        chapterId: 'chapter-1',
        chapterTitle: 'Chapter 1',
        positionMs: 1200,
        note: 'important',
        createdAt: '2026-05-11T00:00:00.000Z',
      };
    },
    async listBookmarks() {
      return { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0, hasNext: false } };
    },
    async deleteBookmark() {
      return { deleted: true };
    },
    async addFavorite() {
      return {
        favorited: true,
        favorite: {
          id: 'favorite-1',
          audiobookId: 'book-1',
          audiobookTitle: 'Atomic Habits',
          audiobookCoverImageAssetKey: 'covers/book-1.jpg',
          authorName: 'James Clear',
          durationSec: 3600,
          premiumFlag: true,
          createdAt: '2026-05-11T00:00:00.000Z',
        },
      };
    },
    async removeFavorite() {
      return { deleted: true };
    },
    async listFavorites() {
      return { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0, hasNext: false } };
    },
    async createNote() {
      return {
        id: 'note-1',
        audiobookId: 'book-1',
        audiobookTitle: 'Atomic Habits',
        audiobookCoverImageAssetKey: 'covers/book-1.jpg',
        authorName: 'James Clear',
        chapterId: 'chapter-1',
        chapterTitle: 'Chapter 1',
        positionMs: 1200,
        content: 'keep this point',
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      };
    },
    async listNotes() {
      return { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0, hasNext: false } };
    },
    async getNote() {
      return null;
    },
    async updateNote() {
      return null;
    },
    async deleteNote() {
      return { deleted: true };
    },
    ...overrides,
  } as EngagementService;
}

test('EngagementController delegates bookmark creation to the service', async () => {
  const controller = new EngagementController(createServiceStub());
  const bookmark = await controller.createBookmark('user-1', {
    audiobookId: 'book-1',
    chapterId: 'chapter-1',
    positionMs: 1200,
    note: 'important',
  });

  assert.equal(bookmark.id, 'bookmark-1');
});

