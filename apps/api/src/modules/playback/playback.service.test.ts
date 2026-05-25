import assert from 'node:assert/strict';
import test from 'node:test';

import { PlaybackService } from './playback.service.js';
import type { PlaybackRepositoryBundle } from './playback.repository.js';
import type { ContentRepositoryBundle } from '../content/content.repository.js';

function createContentRepositories(): ContentRepositoryBundle {
  return {
    audiobookRepository: {
      async findById() {
        return null;
      },
      async findPublishedById(id: string) {
        return {
          id,
          title: 'Book',
          description: null,
          coverImageAssetKey: null,
          authorId: 'author-1',
          durationSec: 3600,
          status: 'published',
          premiumFlag: false,
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
      async updateAudiobook(input) {
        return {
          id: input.id,
          title: input.title,
          description: input.description,
          coverImageAssetKey: input.coverImageAssetKey,
          authorId: input.authorId,
          durationSec: input.durationSec,
          status: 'draft',
          premiumFlag: input.premiumFlag,
          languageCode: input.languageCode,
          publishedAt: null,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async publishAudiobook(id: string) {
        return {
          id,
          title: 'Book',
          description: null,
          coverImageAssetKey: null,
          authorId: 'author-1',
          durationSec: 3600,
          status: 'published',
          premiumFlag: false,
          languageCode: 'vi',
          publishedAt: new Date('2026-05-11T00:00:00.000Z'),
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async unpublishAudiobook(id: string) {
        return {
          id,
          title: 'Book',
          description: null,
          coverImageAssetKey: null,
          authorId: 'author-1',
          durationSec: 3600,
          status: 'unpublished',
          premiumFlag: false,
          languageCode: 'vi',
          publishedAt: new Date('2026-05-11T00:00:00.000Z'),
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
    },
    chapterRepository: {
      async findByAudiobookId() {
        return [
          {
            id: 'chapter-1',
            audiobookId: 'book-1',
            title: 'Chapter 1',
            orderIndex: 1,
            durationSec: 1200,
            audioAssetKey: 'audio/ch1.mp3',
            transcript: null,
            status: 'published',
            createdAt: new Date('2026-05-11T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          },
        ];
      },
      async findPublishedAudioAssetAccessContext(audioAssetKey: string) {
        return audioAssetKey === 'audio/ch1.mp3'
          ? {
              audiobookId: 'book-1',
              audiobookStatus: 'published',
              chapterId: 'chapter-1',
              chapterStatus: 'published',
              premiumFlag: false,
            }
          : null;
      },
      async findById(id: string) {
        return id === 'chapter-1'
          ? {
              id: 'chapter-1',
              audiobookId: 'book-1',
              title: 'Chapter 1',
              orderIndex: 1,
              durationSec: 1200,
              audioAssetKey: 'audio/ch1.mp3',
              transcript: null,
              status: 'published',
              createdAt: new Date('2026-05-11T00:00:00.000Z'),
              updatedAt: new Date('2026-05-11T00:00:00.000Z'),
            }
          : null;
      },
      async updateChapter(input) {
        return {
          id: input.id,
          audiobookId: 'book-1',
          title: input.title,
          orderIndex: input.orderIndex,
          durationSec: input.durationSec,
          audioAssetKey: input.audioAssetKey,
          transcript: input.transcript,
          status: 'draft',
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async publishChapter(id: string) {
        return {
          id,
          audiobookId: 'book-1',
          title: 'Chapter 1',
          orderIndex: 1,
          durationSec: 1200,
          audioAssetKey: 'audio/ch1.mp3',
          transcript: null,
          status: 'published',
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async unpublishChapter(id: string) {
        return {
          id,
          audiobookId: 'book-1',
          title: 'Chapter 1',
          orderIndex: 1,
          durationSec: 1200,
          audioAssetKey: 'audio/ch1.mp3',
          transcript: null,
          status: 'draft',
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
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
        return {
          id: 'author-1',
          name: 'Author',
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
    },
  };
}

function createPlaybackRepositories(): PlaybackRepositoryBundle {
  const store = new Map<string, {
    id: string;
    userId: string;
    audiobookId: string;
    chapterId: string;
    positionMs: number;
    completed: boolean;
    lastPlayedAt: Date | null;
    updatedAt: Date;
  }>();

  return {
    progressRepository: {
      async findByUserAndAudiobookId(userId: string, audiobookId: string) {
        return Array.from(store.values()).find((item) => item.userId === userId && item.audiobookId === audiobookId) ?? null;
      },
      async upsertProgress(input) {
        const key = `${input.userId}:${input.audiobookId}`;
        const existing = store.get(key);
        const row = {
          id: existing?.id ?? `progress-${store.size + 1}`,
          userId: input.userId,
          audiobookId: input.audiobookId,
          chapterId: input.chapterId,
          positionMs: input.positionMs,
          completed: input.completed,
          lastPlayedAt: input.lastPlayedAt,
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
        store.set(key, row);
        return row;
      },
    },
  };
}

test('PlaybackService saves progress and returns a normalized dto', async () => {
  const service = new PlaybackService({
    repositories: createPlaybackRepositories(),
    contentRepositories: createContentRepositories(),
  });

  const result = await service.saveProgress('user-1', {
    audiobookId: 'book-1',
    chapterId: 'chapter-1',
    positionMs: 5000,
  });

  assert.equal(result.userId, 'user-1');
  assert.equal(result.audiobookId, 'book-1');
  assert.equal(result.chapterId, 'chapter-1');
  assert.equal(result.positionMs, 5000);
  assert.equal(result.completed, false);
});

test('PlaybackService rejects progress for a chapter that belongs to another audiobook', async () => {
  const service = new PlaybackService({
    repositories: createPlaybackRepositories(),
    contentRepositories: {
      ...createContentRepositories(),
      chapterRepository: {
        async findByAudiobookId() {
          return [];
        },
        async findPublishedAudioAssetAccessContext() {
          return null;
        },
        async findById() {
          return {
            id: 'chapter-2',
            audiobookId: 'book-2',
            title: 'Chapter 2',
            orderIndex: 1,
            durationSec: 1200,
            audioAssetKey: 'audio/ch2.mp3',
            transcript: null,
            status: 'published',
            createdAt: new Date('2026-05-11T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          };
        },
      },
    },
  });

  await assert.rejects(
    () =>
      service.saveProgress('user-1', {
        audiobookId: 'book-1',
        chapterId: 'chapter-2',
        positionMs: 5000,
      }),
    /does not belong/,
  );
});

test('PlaybackService rejects negative progress positions', async () => {
  const service = new PlaybackService({
    repositories: createPlaybackRepositories(),
    contentRepositories: createContentRepositories(),
  });

  await assert.rejects(
    () =>
      service.saveProgress('user-1', {
        audiobookId: 'book-1',
        chapterId: 'chapter-1',
        positionMs: -1,
      }),
    /non-negative integer/,
  );
});
