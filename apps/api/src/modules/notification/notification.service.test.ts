import assert from 'node:assert/strict';
import test from 'node:test';

import type { ContentRepositoryBundle } from '../content/content.repository.js';
import type { EngagementRepositoryBundle } from '../engagement/engagement.repository.js';
import type { PlaybackRepositoryBundle } from '../playback/playback.repository.js';
import { NotificationService } from './notification.service.js';

function createDependencies(): {
  service: NotificationService;
} {
  const contentRepositories: ContentRepositoryBundle = {
    audiobookRepository: {
      async findById() {
        return null;
      },
      async findPublishedById(id: string) {
        return id === 'book-1'
          ? {
              id: 'book-1',
              title: 'Atomic Habits',
              description: 'Tiny changes',
              coverImageAssetKey: 'covers/book-1.jpg',
              authorId: 'author-1',
              durationSec: 3600,
              status: 'published',
              premiumFlag: false,
              languageCode: 'en',
              publishedAt: new Date('2026-05-05T00:00:00.000Z'),
              createdAt: new Date('2026-05-01T00:00:00.000Z'),
              updatedAt: new Date('2026-05-05T00:00:00.000Z'),
            }
          : id === 'book-2'
            ? {
                id: 'book-2',
                title: 'Deep Work',
                description: 'Focus',
                coverImageAssetKey: 'covers/book-2.jpg',
                authorId: 'author-2',
                durationSec: 4200,
                status: 'published',
                premiumFlag: true,
                languageCode: 'en',
                publishedAt: new Date('2026-06-01T00:00:00.000Z'),
                createdAt: new Date('2026-06-01T00:00:00.000Z'),
                updatedAt: new Date('2026-06-01T00:00:00.000Z'),
              }
            : null;
      },
      async listPublished() {
        return [];
      },
      async countPublished() {
        return 0;
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
      async findById(id: string) {
        if (id === 'chapter-1') {
          return {
            id: 'chapter-1',
            audiobookId: 'book-1',
            title: 'Chapter 1',
            orderIndex: 1,
            durationSec: 900,
            audioAssetKey: 'audio/book-1/chapter-1.mp3',
            transcript: null,
            status: 'published',
            createdAt: new Date('2026-05-01T00:00:00.000Z'),
            updatedAt: new Date('2026-05-01T00:00:00.000Z'),
          };
        }

        if (id === 'chapter-2') {
          return {
            id: 'chapter-2',
            audiobookId: 'book-2',
            title: 'Chapter 2',
            orderIndex: 2,
            durationSec: 1200,
            audioAssetKey: 'audio/book-2/chapter-2.mp3',
            transcript: null,
            status: 'published',
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-01T00:00:00.000Z'),
          };
        }

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
        return {
          data: [
            {
              id: 'bookmark-1',
              audiobookId: 'book-2',
              audiobookTitle: 'Deep Work',
              audiobookCoverImageAssetKey: null,
              authorName: 'Cal Newport',
              chapterId: 'chapter-2',
              chapterTitle: 'Chapter 2',
              positionMs: 1000,
              note: null,
              createdAt: new Date('2026-06-09T00:00:00.000Z'),
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
        return {
          data: [],
          totalItems: 0,
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
        return {
          data: [
            {
              id: 'note-1',
              audiobookId: 'book-1',
              audiobookTitle: 'Atomic Habits',
              audiobookCoverImageAssetKey: null,
              authorName: 'James Clear',
              chapterId: 'chapter-1',
              chapterTitle: 'Chapter 1',
              positionMs: 500,
              content: 'Remember this',
              createdAt: new Date('2026-06-09T01:00:00.000Z'),
              updatedAt: new Date('2026-06-09T01:00:00.000Z'),
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
        return [
          {
            audiobookId: 'book-2',
            audiobookTitle: 'Deep Work',
            audiobookCoverImageAssetKey: null,
            authorName: 'Cal Newport',
            chapterId: 'chapter-2',
            chapterTitle: 'Chapter 2',
            positionMs: 230000,
            totalDurationMs: 1200000,
            completed: false,
            lastPlayedAt: new Date('2026-06-09T02:00:00.000Z'),
            premiumFlag: false,
          },
          {
            audiobookId: 'book-1',
            audiobookTitle: 'Atomic Habits',
            audiobookCoverImageAssetKey: null,
            authorName: 'James Clear',
            chapterId: 'chapter-1',
            chapterTitle: 'Chapter 1',
            positionMs: 120000,
            totalDurationMs: 900000,
            completed: false,
            lastPlayedAt: new Date('2026-06-09T01:30:00.000Z'),
            premiumFlag: false,
          },
        ];
      },
      async upsertProgress() {
        throw new Error('not expected');
      },
    },
  };

  const service = new NotificationService({
    contentRepositories,
    engagementRepositories,
    playbackRepositories,
    clock: () => new Date('2026-06-09T12:00:00.000Z'),
  });

  return { service };
}

test('NotificationService returns the best unfinished listening reminder', async () => {
  const { service } = createDependencies();

  const result = await service.getHome('user-1');

  assert.equal(result.meta.windowDays, 7);
  assert.ok(result.data.resumeReminder);
  assert.equal(result.data.resumeReminder?.audiobookId, 'book-2');
  assert.equal(result.data.resumeReminder?.chapterId, 'chapter-2');
  assert.equal(result.data.resumeReminder?.title, 'Deep Work');
  assert.equal(result.data.resumeReminder?.subtitle, 'Resume Chapter 2 at 03:50');
});

test('NotificationService returns null when there is no unfinished listening activity', async () => {
  const contentRepositories: ContentRepositoryBundle = {
    audiobookRepository: {
      async findById() {
        return null;
      },
      async findPublishedById() {
        return null;
      },
      async listPublished() {
        return [];
      },
      async countPublished() {
        return 0;
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
        return { data: [], totalItems: 0 };
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
        return { data: [], totalItems: 0 };
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
        return { data: [], totalItems: 0 };
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
        return [
          {
            audiobookId: 'book-1',
            audiobookTitle: 'Atomic Habits',
            audiobookCoverImageAssetKey: 'covers/book-1.jpg',
            authorName: 'James Clear',
            chapterId: 'chapter-1',
            chapterTitle: 'Chapter 1',
            positionMs: 120000,
            totalDurationMs: 900000,
            completed: true,
            lastPlayedAt: new Date('2026-06-09T01:30:00.000Z'),
            premiumFlag: false,
          },
        ];
      },
      async upsertProgress() {
        throw new Error('not expected');
      },
    },
  };

  const service = new NotificationService({
    contentRepositories,
    engagementRepositories,
    playbackRepositories,
    clock: () => new Date('2026-06-09T12:00:00.000Z'),
  });

  const result = await service.getHome('user-1');

  assert.equal(result.data.resumeReminder, null);
});
