import assert from 'node:assert/strict';
import test from 'node:test';

import type { ContentRepositoryBundle } from '../content/content.repository.js';
import type { EngagementRepositoryBundle } from '../engagement/engagement.repository.js';
import type { PlaybackRepositoryBundle } from '../playback/playback.repository.js';
import { RetentionService } from './retention.service.js';

function createDependencies(): {
  service: RetentionService;
  calls: {
    listPublished: number;
    listBookmarks: number;
    listFavorites: number;
    listNotes: number;
    listRecentByUser: number;
  };
} {
  const calls = {
    listPublished: 0,
    listBookmarks: 0,
    listFavorites: 0,
    listNotes: 0,
    listRecentByUser: 0,
  };

  const contentRepositories: ContentRepositoryBundle = {
    audiobookRepository: {
      async findById() {
        return null;
      },
      async findPublishedById() {
        return null;
      },
      async listPublished() {
        calls.listPublished += 1;
        return [
          {
            id: 'book-1',
            title: 'Atomic Habits',
            description: 'Tiny changes',
            coverImageAssetKey: 'covers/book-1.jpg',
            authorId: 'author-1',
            authorName: 'James Clear',
            durationSec: 3600,
            status: 'published',
            premiumFlag: false,
            languageCode: 'en',
            publishedAt: new Date('2026-05-05T00:00:00.000Z'),
            createdAt: new Date('2026-05-01T00:00:00.000Z'),
            updatedAt: new Date('2026-05-05T00:00:00.000Z'),
          },
          {
            id: 'book-2',
            title: 'Make It Stick',
            description: 'Learning science',
            coverImageAssetKey: 'covers/book-2.jpg',
            authorId: 'author-2',
            authorName: 'James Clear',
            durationSec: 4200,
            status: 'published',
            premiumFlag: true,
            languageCode: 'en',
            publishedAt: new Date('2026-06-01T00:00:00.000Z'),
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-01T00:00:00.000Z'),
          },
          {
            id: 'book-3',
            title: 'Deep Work',
            description: 'Focus',
            coverImageAssetKey: 'covers/book-3.jpg',
            authorId: 'author-3',
            authorName: 'Cal Newport',
            durationSec: 4800,
            status: 'published',
            premiumFlag: false,
            languageCode: 'en',
            publishedAt: new Date('2026-05-20T00:00:00.000Z'),
            createdAt: new Date('2026-05-20T00:00:00.000Z'),
            updatedAt: new Date('2026-05-20T00:00:00.000Z'),
          },
          {
            id: 'book-4',
            title: 'Deep Work 2',
            description: 'More focus',
            coverImageAssetKey: 'covers/book-4.jpg',
            authorId: 'author-3',
            authorName: 'Cal Newport',
            durationSec: 5100,
            status: 'published',
            premiumFlag: false,
            languageCode: 'en',
            publishedAt: new Date('2026-06-03T00:00:00.000Z'),
            createdAt: new Date('2026-06-03T00:00:00.000Z'),
            updatedAt: new Date('2026-06-03T00:00:00.000Z'),
          },
        ];
      },
      async countPublished() {
        return 4;
      },
      async createAudiobook() {
        throw new Error('not expected');
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
    },
    chapterRepository: {
      async findByAudiobookId() {
        return [];
      },
      async findById() {
        return null;
      },
      async findPublishedAudioAssetAccessContext() {
        return null;
      },
      async createChapter() {
        throw new Error('not expected');
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
  };

  const engagementRepositories: EngagementRepositoryBundle = {
    bookmarkRepository: {
      async findByUserAndId() {
        return null;
      },
      async listBookmarks() {
        calls.listBookmarks += 1;
        return {
          data: [
            {
              id: 'bookmark-1',
              audiobookId: 'book-1',
              audiobookTitle: 'Atomic Habits',
              audiobookCoverImageAssetKey: 'covers/book-1.jpg',
              authorName: 'James Clear',
              chapterId: 'chapter-1',
              chapterTitle: 'Chapter 1',
              positionMs: 120000,
              note: null,
              createdAt: new Date('2026-06-08T00:00:00.000Z'),
            },
          ],
          totalItems: 1,
        };
      },
      async createBookmark() {
        throw new Error('not expected');
      },
      async deleteBookmark() {
        throw new Error('not expected');
      },
    },
    favoriteRepository: {
      async findByUserAndAudiobookId() {
        return null;
      },
      async listFavorites() {
        calls.listFavorites += 1;
        return {
          data: [
            {
              id: 'favorite-1',
              audiobookId: 'book-3',
              audiobookTitle: 'Deep Work',
              audiobookCoverImageAssetKey: 'covers/book-3.jpg',
              authorName: 'Cal Newport',
              durationSec: 4800,
              premiumFlag: false,
              createdAt: new Date('2026-06-07T00:00:00.000Z'),
            },
          ],
          totalItems: 1,
        };
      },
      async upsertFavorite() {
        throw new Error('not expected');
      },
      async deleteFavorite() {
        throw new Error('not expected');
      },
    },
    noteRepository: {
      async findByUserAndId() {
        return null;
      },
      async listNotes() {
        calls.listNotes += 1;
        return {
          data: [
            {
              id: 'note-1',
              audiobookId: 'book-1',
              audiobookTitle: 'Atomic Habits',
              audiobookCoverImageAssetKey: 'covers/book-1.jpg',
              authorName: 'James Clear',
              chapterId: 'chapter-1',
              chapterTitle: 'Chapter 1',
              positionMs: 150000,
              content: 'Important',
              createdAt: new Date('2026-06-09T00:00:00.000Z'),
              updatedAt: new Date('2026-06-09T00:00:00.000Z'),
            },
          ],
          totalItems: 1,
        };
      },
      async createNote() {
        throw new Error('not expected');
      },
      async updateNote() {
        throw new Error('not expected');
      },
      async deleteNote() {
        throw new Error('not expected');
      },
    },
  };

  const playbackRepositories: PlaybackRepositoryBundle = {
    progressRepository: {
      async findByUserAndAudiobookId() {
        return null;
      },
      async listRecentByUser() {
        calls.listRecentByUser += 1;
        return [
          {
            audiobookId: 'book-3',
            audiobookTitle: 'Deep Work',
            audiobookCoverImageAssetKey: 'covers/book-3.jpg',
            authorName: 'Cal Newport',
            chapterId: 'chapter-2',
            chapterTitle: 'Chapter 2',
            positionMs: 230000,
            totalDurationMs: 480000,
            completed: false,
            lastPlayedAt: new Date('2026-06-09T01:00:00.000Z'),
            premiumFlag: false,
          },
        ];
      },
      async upsertProgress() {
        throw new Error('not expected');
      },
    },
  };

  const service = new RetentionService({
    contentRepositories,
    engagementRepositories,
    playbackRepositories,
    clock: () => new Date('2026-06-09T12:00:00.000Z'),
  });

  return { service, calls };
}

test('RetentionService builds a weekly summary and recommendations from recent activity', async () => {
  const { service, calls } = createDependencies();

  const result = await service.getHome('user-1');

  assert.equal(calls.listPublished, 1);
  assert.equal(calls.listBookmarks, 1);
  assert.equal(calls.listFavorites, 1);
  assert.equal(calls.listNotes, 1);
  assert.equal(calls.listRecentByUser, 1);

  assert.equal(result.meta.windowDays, 7);
  assert.equal(result.data.weeklySummary.activeDays, 3);
  assert.equal(result.data.weeklySummary.bookmarksCreated, 1);
  assert.equal(result.data.weeklySummary.notesCreated, 1);
  assert.equal(result.data.weeklySummary.favoritesAdded, 1);
  assert.equal(result.data.weeklySummary.listeningSessions, 1);
  assert.equal(result.data.weeklySummary.topAudiobookTitle, 'Deep Work');
  assert.ok(result.data.weeklySummary.headline.length > 0);
  assert.equal(result.data.recommendations.length, 2);
  assert.equal(result.data.recommendations[0]?.audiobookId, 'book-4');
  assert.equal(result.data.recommendations[0]?.reasonType, 'MORE_FROM_AUTHOR');
  assert.equal(result.data.recommendations[0]?.reason, 'More from Cal Newport');
  assert.equal(result.data.recommendations[1]?.audiobookId, 'book-2');
});
