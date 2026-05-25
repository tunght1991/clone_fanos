import assert from 'node:assert/strict';
import test from 'node:test';

import type { ContentRepositoryBundle } from '../content/content.repository.js';
import { EngagementService } from './engagement.service.js';
import type { EngagementRepositoryBundle } from './engagement.repository.js';
import type { BookmarkSummaryRow, FavoriteSummaryRow, NoteSummaryRow } from './engagement.types.js';

function createService(overrides: Partial<EngagementRepositoryBundle> = {}, contentOverrides: Partial<ContentRepositoryBundle> = {}) {
  const repositories: EngagementRepositoryBundle = {
    bookmarkRepository: {
      async findByUserAndId() {
        return null;
      },
      async listBookmarks() {
        return { data: [], totalItems: 0 };
      },
      async createBookmark(input) {
        const row: BookmarkSummaryRow = {
          id: 'bookmark-1',
          audiobookId: input.audiobookId,
          audiobookTitle: 'Atomic Habits',
          audiobookCoverImageAssetKey: 'covers/book-1.jpg',
          authorName: 'James Clear',
          chapterId: input.chapterId,
          chapterTitle: 'Chapter 1',
          positionMs: input.positionMs,
          note: input.note,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
        return row;
      },
      async deleteBookmark() {
        return true;
      },
      ...overrides.bookmarkRepository,
    },
    favoriteRepository: {
      async findByUserAndAudiobookId() {
        return null;
      },
      async listFavorites() {
        return { data: [], totalItems: 0 };
      },
      async upsertFavorite(input) {
        const row: FavoriteSummaryRow = {
          id: 'favorite-1',
          audiobookId: input.audiobookId,
          audiobookTitle: 'Atomic Habits',
          audiobookCoverImageAssetKey: 'covers/book-1.jpg',
          authorName: 'James Clear',
          durationSec: 3600,
          premiumFlag: true,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
        return row;
      },
      async deleteFavorite() {
        return true;
      },
      ...overrides.favoriteRepository,
    },
    noteRepository: {
      async findByUserAndId() {
        return null;
      },
      async listNotes() {
        return { data: [], totalItems: 0 };
      },
      async createNote(input) {
        const row: NoteSummaryRow = {
          id: 'note-1',
          audiobookId: input.audiobookId,
          audiobookTitle: 'Atomic Habits',
          audiobookCoverImageAssetKey: 'covers/book-1.jpg',
          authorName: 'James Clear',
          chapterId: input.chapterId,
          chapterTitle: 'Chapter 1',
          positionMs: input.positionMs,
          content: input.content,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
        return row;
      },
      async updateNote(userId, noteId, input) {
        const row: NoteSummaryRow = {
          id: noteId,
          audiobookId: 'book-1',
          audiobookTitle: 'Atomic Habits',
          audiobookCoverImageAssetKey: 'covers/book-1.jpg',
          authorName: 'James Clear',
          chapterId: 'chapter-1',
          chapterTitle: 'Chapter 1',
          positionMs: 1234,
          content: input.content,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
        return row;
      },
      async deleteNote() {
        return true;
      },
      ...overrides.noteRepository,
    },
  };

  const service = new EngagementService({
    repositories,
    contentRepositories: {
      audiobookRepository: {
        async findById() {
          return null;
        },
        async findPublishedById(id) {
          return {
            id,
            title: 'Atomic Habits',
            description: null,
            coverImageAssetKey: 'covers/book-1.jpg',
            authorId: 'author-1',
            durationSec: 3600,
            status: 'published',
            premiumFlag: true,
            languageCode: 'vi',
            publishedAt: new Date('2026-05-11T00:00:00.000Z'),
            createdAt: new Date('2026-05-11T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          };
        },
        async listPublished() {
          return [];
        },
        async countPublished() {
          return 0;
        },
        async updateAudiobook() {
          throw new Error('not expected');
        },
        async publishAudiobook() {
          throw new Error('not expected');
        },
        async unpublishAudiobook() {
          throw new Error('not expected');
        },
        ...contentOverrides.audiobookRepository,
      },
      chapterRepository: {
        async findByAudiobookId() {
          return [];
        },
        async findById(id) {
          return {
            id,
            audiobookId: 'book-1',
            title: 'Chapter 1',
            orderIndex: 1,
            durationSec: 3600,
            audioAssetKey: 'audio/chapter-1.mp3',
            transcript: null,
            status: 'published',
            createdAt: new Date('2026-05-11T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          };
        },
        async findPublishedAudioAssetAccessContext(audioAssetKey: string) {
          return audioAssetKey === 'audio/chapter-1.mp3'
            ? {
                audiobookId: 'book-1',
                audiobookStatus: 'published',
                chapterId: 'chapter-1',
                chapterStatus: 'published',
                premiumFlag: true,
              }
            : null;
        },
        async updateChapter() {
          throw new Error('not expected');
        },
        async publishChapter() {
          throw new Error('not expected');
        },
        async unpublishChapter() {
          throw new Error('not expected');
        },
        ...contentOverrides.chapterRepository,
      },
      audiobookNarratorRepository: {
        async findByAudiobookId() {
          return [];
        },
        async findDetailedByAudiobookId() {
          return [];
        },
      },
      authorRepository: {
        async findById() {
          return null;
        },
      },
      ...contentOverrides,
    } as ContentRepositoryBundle,
  });

  return service;
}

test('EngagementService creates bookmark after validating content context', async () => {
  const service = createService();

  const bookmark = await service.createBookmark('user-1', {
    audiobookId: 'book-1',
    chapterId: 'chapter-1',
    positionMs: 1200,
    note: '  important  ',
  });

  assert.equal(bookmark.id, 'bookmark-1');
  assert.equal(bookmark.note, 'important');
  assert.equal(bookmark.audiobookTitle, 'Atomic Habits');
});

test('EngagementService rejects bookmark positions beyond chapter duration', async () => {
  const service = createService();

  await assert.rejects(
    () =>
      service.createBookmark('user-1', {
        audiobookId: 'book-1',
        chapterId: 'chapter-1',
        positionMs: 3600 * 1000 + 1,
      }),
    /positionMs exceeds chapter duration/i,
  );
});

test('EngagementService adds favorite idempotently', async () => {
  const service = createService({
    favoriteRepository: {
      async findByUserAndAudiobookId() {
        return {
          id: 'favorite-1',
          audiobookId: 'book-1',
          audiobookTitle: 'Atomic Habits',
          audiobookCoverImageAssetKey: 'covers/book-1.jpg',
          authorName: 'James Clear',
          durationSec: 3600,
          premiumFlag: true,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listFavorites() {
        return { data: [], totalItems: 0 };
      },
      async upsertFavorite() {
        return {
          id: 'favorite-1',
          audiobookId: 'book-1',
          audiobookTitle: 'Atomic Habits',
          audiobookCoverImageAssetKey: 'covers/book-1.jpg',
          authorName: 'James Clear',
          durationSec: 3600,
          premiumFlag: true,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async deleteFavorite() {
        return true;
      },
    },
  });

  const result = await service.addFavorite('user-1', 'book-1');
  assert.equal(result.favorited, true);
  assert.equal(result.favorite.audiobookId, 'book-1');
});

test('EngagementService creates, updates and deletes notes', async () => {
  const service = createService();

  const created = await service.createNote('user-1', {
    audiobookId: 'book-1',
    chapterId: 'chapter-1',
    positionMs: 1500,
    content: '  keep this point  ',
  });

  assert.equal(created.content, 'keep this point');

  const updated = await service.updateNote('user-1', 'note-1', {
    content: '  updated point  ',
  });

  assert.equal(updated?.data.content, 'updated point');

  const deleted = await service.deleteNote('user-1', 'note-1');
  assert.equal(deleted.deleted, true);
});
