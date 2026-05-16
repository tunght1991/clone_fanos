import assert from 'node:assert/strict';
import test from 'node:test';

import { ContentService } from './content.service.js';
import type { ContentRepositoryBundle } from './content.repository.js';

function createRepositoryBundle(overrides: Partial<ContentRepositoryBundle> = {}): ContentRepositoryBundle {
  return {
    audiobookRepository: {
      async findById() {
        return null;
      },
      async findPublishedById(id: string) {
        return {
          id,
          title: 'Test Book',
          description: 'Description',
          coverImageAssetKey: 'covers/test.jpg',
          authorId: 'author-1',
          authorName: 'Author Name',
          durationSec: 3600,
          status: 'published',
          premiumFlag: true,
          languageCode: 'vi',
          publishedAt: new Date('2026-05-11T00:00:00.000Z'),
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listPublished() {
        return [];
      },
      async countPublished() {
        return 1;
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
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async publishAudiobook(id: string) {
        return {
          id,
          title: 'Test Book',
          description: 'Description',
          coverImageAssetKey: 'covers/test.jpg',
          authorId: 'author-1',
          durationSec: 3600,
          status: 'published',
          premiumFlag: true,
          languageCode: 'vi',
          publishedAt: new Date('2026-05-11T00:00:00.000Z'),
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async unpublishAudiobook(id: string) {
        return {
          id,
          title: 'Test Book',
          description: 'Description',
          coverImageAssetKey: 'covers/test.jpg',
          authorId: 'author-1',
          durationSec: 3600,
          status: 'unpublished',
          premiumFlag: true,
          languageCode: 'vi',
          publishedAt: new Date('2026-05-11T00:00:00.000Z'),
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      ...overrides.audiobookRepository,
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
            createdAt: new Date('2026-05-10T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          },
        ];
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
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
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
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
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
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      ...overrides.chapterRepository,
    },
    audiobookNarratorRepository: {
      async findByAudiobookId() {
        return [
          {
            id: 'an-1',
            audiobookId: 'book-1',
            narratorId: 'narrator-1',
            narratorName: 'Narrator Name',
            roleIndex: 1,
            isPrimary: true,
            createdAt: new Date('2026-05-10T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          },
        ];
      },
      async findDetailedByAudiobookId() {
        return [
          {
            id: 'an-1',
            audiobookId: 'book-1',
            narratorId: 'narrator-1',
            narratorName: 'Narrator Name',
            roleIndex: 1,
            isPrimary: true,
            createdAt: new Date('2026-05-10T00:00:00.000Z'),
            updatedAt: new Date('2026-05-11T00:00:00.000Z'),
          },
        ];
      },
      ...overrides.audiobookNarratorRepository,
    },
    authorRepository: {
      async findById(id: string) {
        return {
          id,
          name: 'Author Name',
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      ...overrides.authorRepository,
    },
  };
}

test('ContentService loads published audiobook detail from repository bundle', async () => {
  const service = new ContentService(createRepositoryBundle());

  const detail = await service.getPublishedAudiobookDetail('book-1');

  assert.ok(detail);
  assert.equal(detail?.id, 'book-1');
  assert.equal(detail?.chapters.length, 1);
  assert.equal(detail?.narrators.length, 1);
  assert.equal(detail?.publishedAt, '2026-05-11T00:00:00.000Z');
  assert.equal(detail?.author.name, 'Author Name');
});

test('ContentService returns null when audiobook is not published', async () => {
  const service = new ContentService(
    createRepositoryBundle({
      audiobookRepository: {
        async findPublishedById() {
          return null;
        },
      } as ContentRepositoryBundle['audiobookRepository'],
    }),
  );

  const detail = await service.getPublishedAudiobookDetail('missing');

  assert.equal(detail, null);
});
