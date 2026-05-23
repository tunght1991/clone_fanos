import assert from 'node:assert/strict';
import test from 'node:test';

import { ContentMutationService } from './content.mutation.service.js';
import type { ContentMutationRepositoryBundle } from './content.mutation.types.js';

function createRepositoryBundle(): ContentMutationRepositoryBundle {
  return {
    audiobookRepository: {
      async findById(id) {
        return {
          id,
          title: 'Book',
          description: null,
          coverImageAssetKey: null,
          authorId: 'author-1',
          durationSec: 1200,
          status: 'draft',
          premiumFlag: true,
          languageCode: 'vi',
          publishedAt: null,
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async createAudiobook(input) {
        return {
          id: 'book-1',
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
      async publishAudiobook(id) {
        return {
          id,
          title: 'Book',
          description: null,
          coverImageAssetKey: null,
          authorId: 'author-1',
          durationSec: 1200,
          status: 'published',
          premiumFlag: true,
          languageCode: 'vi',
          publishedAt: new Date('2026-05-11T00:00:00.000Z'),
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async unpublishAudiobook(id) {
        return {
          id,
          title: 'Book',
          description: null,
          coverImageAssetKey: null,
          authorId: 'author-1',
          durationSec: 1200,
          status: 'unpublished',
          premiumFlag: true,
          languageCode: 'vi',
          publishedAt: new Date('2026-05-11T00:00:00.000Z'),
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
    },
    chapterRepository: {
      async createChapter(input) {
        return {
          id: 'chapter-1',
          audiobookId: input.audiobookId,
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
      async publishChapter(id) {
        return {
          id,
          audiobookId: 'book-1',
          title: 'Chapter',
          orderIndex: 1,
          durationSec: 600,
          audioAssetKey: 'audio/ch1.mp3',
          transcript: null,
          status: 'published',
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async unpublishChapter(id) {
        return {
          id,
          audiobookId: 'book-1',
          title: 'Chapter',
          orderIndex: 1,
          durationSec: 600,
          audioAssetKey: 'audio/ch1.mp3',
          transcript: null,
          status: 'draft',
          createdAt: new Date('2026-05-10T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
    },
  };
}

test('ContentMutationService enqueues audiobook reindex after audiobook update', async () => {
  const calls: Array<{ audiobookId: string; reason: string }> = [];
  const service = new ContentMutationService({
    repositories: createRepositoryBundle(),
    auditLogger: {
      async record() {
        return {
          id: 'audit-1',
          entityType: 'audiobook',
          entityId: 'book-1',
          entityTitle: 'Book',
          action: 'publish',
          actorUserId: null,
          actorRole: null,
          traceId: null,
          payloadJson: {},
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listByEntity() {
        return [];
      },
    },
    reindexQueue: {
      async enqueueAudiobookReindex(input) {
        calls.push(input);
      },
    },
    transaction: async (work) => work(createRepositoryBundle()),
  });

  const audiobook = await service.updateAudiobook({
    id: 'book-1',
    title: 'New Title',
    description: 'Desc',
    coverImageAssetKey: 'covers/book-1.jpg',
    authorId: 'author-1',
    durationSec: 1200,
    premiumFlag: true,
    languageCode: 'vi',
  });

  assert.equal(audiobook.title, 'New Title');
  assert.deepEqual(calls, [{ audiobookId: 'book-1', reason: 'audiobook_updated' }]);
});

test('ContentMutationService creates audiobook draft without enqueueing reindex', async () => {
  const calls: Array<{ audiobookId: string; reason: string }> = [];
  const service = new ContentMutationService({
    repositories: createRepositoryBundle(),
    auditLogger: {
      async record() {
        return {
          id: 'audit-1',
          entityType: 'audiobook',
          entityId: 'book-1',
          entityTitle: 'Book',
          action: 'publish',
          actorUserId: null,
          actorRole: null,
          traceId: null,
          payloadJson: {},
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listByEntity() {
        return [];
      },
    },
    reindexQueue: {
      async enqueueAudiobookReindex(input) {
        calls.push(input);
      },
    },
    transaction: async (work) => work(createRepositoryBundle()),
  });

  const audiobook = await service.createAudiobook({
    title: 'New Book',
    description: null,
    coverImageAssetKey: 'covers/new-book.jpg',
    authorId: 'author-1',
    durationSec: 0,
    premiumFlag: false,
    languageCode: 'vi',
  });

  assert.equal(audiobook.title, 'New Book');
  assert.equal(audiobook.chapterCount, 0);
  assert.deepEqual(audiobook.chapters, []);
  assert.equal(calls.length, 0);
});

test('ContentMutationService creates audiobook chapters within the same transaction', async () => {
  const createdChapters: Array<{ title: string; orderIndex: number }> = [];
  const repositoryBundle = createRepositoryBundle();
  repositoryBundle.chapterRepository.createChapter = async (input) => {
    createdChapters.push({ title: input.title, orderIndex: input.orderIndex });
    return {
      id: `chapter-${createdChapters.length}`,
      audiobookId: input.audiobookId,
      title: input.title,
      orderIndex: input.orderIndex,
      durationSec: input.durationSec,
      audioAssetKey: input.audioAssetKey,
      transcript: input.transcript,
      status: 'draft',
      createdAt: new Date('2026-05-10T00:00:00.000Z'),
      updatedAt: new Date('2026-05-11T00:00:00.000Z'),
    };
  };

  const service = new ContentMutationService({
    repositories: repositoryBundle,
    auditLogger: {
      async record() {
        return {
          id: 'audit-1',
          entityType: 'audiobook',
          entityId: 'book-1',
          entityTitle: 'Book',
          action: 'publish',
          actorUserId: null,
          actorRole: null,
          traceId: null,
          payloadJson: {},
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listByEntity() {
        return [];
      },
    },
    reindexQueue: {
      async enqueueAudiobookReindex() {
        // no-op
      },
    },
    transaction: async (work) => work(repositoryBundle),
  });

  const audiobook = await service.createAudiobook({
    title: 'New Book',
    description: null,
    coverImageAssetKey: 'covers/new-book.jpg',
    authorId: 'author-1',
    durationSec: 0,
    premiumFlag: false,
    languageCode: 'vi',
    chapters: [
      {
        title: 'Intro',
        orderIndex: 1,
        durationSec: 120,
        audioAssetKey: 'chapters/book-1/intro.mp3',
        transcript: null,
      },
      {
        title: 'Deep dive',
        orderIndex: 2,
        durationSec: 240,
        audioAssetKey: 'chapters/book-1/deep-dive.mp3',
        transcript: 'Section 2',
      },
    ],
  });

  assert.equal(audiobook.title, 'New Book');
  assert.equal(audiobook.chapterCount, 2);
  assert.equal(audiobook.chapters.length, 2);
  assert.equal(audiobook.chapters[0].title, 'Intro');
  assert.equal(audiobook.chapters[1].title, 'Deep dive');
  assert.deepEqual(createdChapters, [
    { title: 'Intro', orderIndex: 1 },
    { title: 'Deep dive', orderIndex: 2 },
  ]);
});

test('ContentMutationService creates chapter after validating audiobook exists', async () => {
  const calls: Array<{ audiobookId: string; reason: string }> = [];
  const service = new ContentMutationService({
    repositories: createRepositoryBundle(),
    auditLogger: {
      async record() {
        return {
          id: 'audit-1',
          entityType: 'chapter',
          entityId: 'chapter-1',
          entityTitle: 'Chapter',
          action: 'publish',
          actorUserId: null,
          actorRole: null,
          traceId: null,
          payloadJson: {},
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listByEntity() {
        return [];
      },
    },
    reindexQueue: {
      async enqueueAudiobookReindex(input) {
        calls.push(input);
      },
    },
    transaction: async (work) => work(createRepositoryBundle()),
  });

  const chapter = await service.createChapter({
    audiobookId: 'book-1',
    title: 'Chapter 1',
    orderIndex: 1,
    durationSec: 600,
    audioAssetKey: 'audio/ch1.mp3',
    transcript: null,
  });

  assert.equal(chapter.title, 'Chapter 1');
  assert.equal(calls.length, 0);
});

test('ContentMutationService enqueues audiobook reindex after chapter publish', async () => {
  const calls: Array<{ audiobookId: string; reason: string }> = [];
  const service = new ContentMutationService({
    repositories: createRepositoryBundle(),
    auditLogger: {
      async record() {
        return {
          id: 'audit-1',
          entityType: 'chapter',
          entityId: 'chapter-1',
          entityTitle: 'Chapter',
          action: 'publish',
          actorUserId: null,
          actorRole: null,
          traceId: null,
          payloadJson: {},
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listByEntity() {
        return [];
      },
    },
    reindexQueue: {
      async enqueueAudiobookReindex(input) {
        calls.push(input);
      },
    },
    transaction: async (work) => work(createRepositoryBundle()),
  });

  const chapter = await service.publishChapter('chapter-1');

  assert.equal(chapter.status, 'published');
  assert.deepEqual(calls, [{ audiobookId: 'book-1', reason: 'chapter_published' }]);
});

test('ContentMutationService enqueues audiobook reindex after chapter unpublish', async () => {
  const calls: Array<{ audiobookId: string; reason: string }> = [];
  const service = new ContentMutationService({
    repositories: createRepositoryBundle(),
    auditLogger: {
      async record() {
        return {
          id: 'audit-1',
          entityType: 'chapter',
          entityId: 'chapter-1',
          entityTitle: 'Chapter',
          action: 'unpublish',
          actorUserId: null,
          actorRole: null,
          traceId: null,
          payloadJson: {},
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listByEntity() {
        return [];
      },
    },
    reindexQueue: {
      async enqueueAudiobookReindex(input) {
        calls.push(input);
      },
    },
    transaction: async (work) => work(createRepositoryBundle()),
  });

  const chapter = await service.unpublishChapter('chapter-1');

  assert.equal(chapter.status, 'draft');
  assert.deepEqual(calls, [{ audiobookId: 'book-1', reason: 'chapter_updated' }]);
});

test('ContentMutationService records audit log for audiobook publish and unpublish', async () => {
  const auditCalls: Array<{ action: string; entityType: string; traceId: string | null }> = [];
  const service = new ContentMutationService({
    repositories: createRepositoryBundle(),
    auditLogger: {
      async record(input) {
        auditCalls.push({
          action: input.action,
          entityType: input.entityType,
          traceId: input.traceId ?? null,
        });
        return {
          id: 'audit-1',
          entityType: input.entityType,
          entityId: input.entityId,
          entityTitle: input.entityTitle ?? null,
          action: input.action,
          actorUserId: input.actorUserId ?? null,
          actorRole: input.actorRole ?? null,
          traceId: input.traceId ?? null,
          payloadJson: input.payloadJson ?? {},
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async listByEntity() {
        return [];
      },
    },
    reindexQueue: {
      async enqueueAudiobookReindex() {
        // no-op
      },
    },
    transaction: async (work) => work(createRepositoryBundle()),
  });

  await service.publishAudiobook('book-1', 'trace-99');
  await service.unpublishAudiobook('book-1', 'trace-99');

  assert.deepEqual(auditCalls, [
    { action: 'publish', entityType: 'audiobook', traceId: 'trace-99' },
    { action: 'unpublish', entityType: 'audiobook', traceId: 'trace-99' },
  ]);
});
