import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthController } from '../modules/auth/auth.controller.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { AuthTokenService } from '../modules/auth/auth-token.js';
import { hashPassword } from '../modules/auth/password-hash.js';
import type { AuthRepositoryBundle } from '../modules/auth/auth.repository.js';
import type { AuthSessionRow, AuthUserRow } from '../modules/auth/auth.types.js';
import { ContentAuditService } from '../modules/content/content.audit.repository.js';
import { ContentMutationService } from '../modules/content/content.mutation.service.js';
import { ContentService } from '../modules/content/content.service.js';
import { ContentController } from '../modules/content/content.controller.js';
import type { ContentAuditRepositoryBundle } from '../modules/content/content.audit.repository.js';
import type { ContentAuditEntryRow, ContentAuditRecordInput } from '../modules/content/content.audit.types.js';
import type { ContentRepositoryBundle } from '../modules/content/content.repository.js';
import type { AudiobookNarratorRow, AudiobookRow, ChapterRow } from '../modules/content/content.types.js';
import { PlaybackController } from '../modules/playback/playback.controller.js';
import { PlaybackService } from '../modules/playback/playback.service.js';
import type { PlaybackRepositoryBundle } from '../modules/playback/playback.repository.js';
import type { PlaybackProgressRow } from '../modules/playback/playback.types.js';
import { SearchController } from '../modules/search/search.controller.js';
import { SearchService } from '../modules/search/search.service.js';
import type { SearchRepositoryBundle } from '../modules/search/search.repository.js';
import type { SearchRepositoryQuery, SearchRepositoryResult } from '../modules/search/search.types.js';
import {
  parseAdminCreateAudiobookRequest,
  parseAdminCreateChapterRequest,
  parseAuthLoginRequest,
  parseAuthRegisterRequest,
  parsePlaybackProgressRequest,
} from './request-schema.js';
import { parseSearchRequestQuery } from './search.http.parsers.js';

test('API smoke flow covers auth, content ops, browse, search, playback and audit trace', async () => {
  const smokeState = createSmokeState();

  const authTokenService = new AuthTokenService({
    issuer: 'clone-fanos-api',
    secret: 'smoke-secret',
    tokenTtlSeconds: 3600,
  });
  const authService = new AuthService({
    repositories: smokeState.authRepositories,
    tokenService: authTokenService,
    refreshTokenTtlSeconds: 86400,
  });
  const authController = new AuthController(authService);

  const contentAuditService = new ContentAuditService(smokeState.contentAuditRepositories.contentAuditRepository);
  const contentMutationService = new ContentMutationService({
    repositories: smokeState.contentRepositories,
    auditLogger: contentAuditService,
    reindexQueue: {
      async enqueueAudiobookReindex(input) {
        smokeState.reindexEvents.push(input);
      },
    },
  });
  const contentService = new ContentService(smokeState.contentRepositories);
  const contentController = new ContentController(contentService);

  const playbackService = new PlaybackService({
    repositories: smokeState.playbackRepositories,
    contentRepositories: smokeState.contentRepositories,
  });
  const playbackController = new PlaybackController(playbackService);

  const searchService = new SearchService({
    repositories: smokeState.searchRepositories,
  });
  const searchController = new SearchController(searchService);

  const adminSession = await authController.login(
    parseAuthLoginRequest({
      email: 'admin@fonos.test',
      password: 'Secret123!',
    }),
  );
  const learnerSession = await authController.register(
    parseAuthRegisterRequest({
      email: 'learner@fonos.test',
      password: 'Secret123!',
      displayName: 'Learner One',
    }),
  );

  const adminPrincipal = await authController.resolvePrincipalFromToken(adminSession.accessToken);
  assert.ok(adminPrincipal);
  assert.equal(adminPrincipal.role, 'admin');
  assert.equal((await authController.me(adminPrincipal.userId))?.displayName, 'Admin One');

  const learnerPrincipal = await authController.resolvePrincipalFromToken(learnerSession.accessToken);
  assert.ok(learnerPrincipal);
  assert.equal(learnerPrincipal.role, 'user');
  assert.equal((await authController.me(learnerPrincipal.userId))?.displayName, 'Learner One');

  await authController.assertRole(adminPrincipal.userId, 'admin');

  const audiobook = await contentMutationService.createAudiobook(
    parseAdminCreateAudiobookRequest({
      title: 'Atomic Habits',
      description: 'Build better habits with tiny changes.',
      coverImageAssetKey: 'covers/atomic-habits.jpg',
      authorId: 'author-1',
      durationSec: 3600,
      premiumFlag: true,
      languageCode: 'VI',
    }),
  );

  const chapter = await contentMutationService.createChapter(
    parseAdminCreateChapterRequest({
      audiobookId: audiobook.id,
      title: 'Chapter 1',
      orderIndex: 1,
      durationSec: 900,
      audioAssetKey: 'audio/atomic-habits/ch1.mp3',
      transcript: 'Habit loops are built from cue, craving, response, and reward.',
    }),
  );

  const publishedAudiobook = await contentMutationService.publishAudiobook(audiobook.id, 'trace-smoke-1');
  const publishedChapter = await contentMutationService.publishChapter(chapter.id, 'trace-smoke-2');

  assert.equal(publishedAudiobook.status, 'published');
  assert.equal(publishedChapter.status, 'published');
  assert.equal(smokeState.reindexEvents.length, 2);
  assert.equal(smokeState.reindexEvents[0].audiobookId, audiobook.id);
  assert.equal(smokeState.reindexEvents[0].reason, 'audiobook_published');
  assert.equal(smokeState.reindexEvents[1].reason, 'chapter_published');

  const contentDetail = await contentController.getAudiobookById(audiobook.id);
  assert.ok(contentDetail);
  assert.equal(contentDetail.data.id, audiobook.id);
  assert.equal(contentDetail.data.chapters.length, 1);
  assert.equal(contentDetail.data.chapters[0].id, chapter.id);
  assert.equal(contentDetail.data.narrators.length, 1);
  assert.equal(contentDetail.data.author.name, 'Ada Lovelace');

  const audiobookList = await contentController.listAudiobooks({ page: 1, pageSize: 20 });
  assert.equal(audiobookList.meta.totalItems, 1);
  assert.equal(audiobookList.data[0].title, 'Atomic Habits');

  const searchResult = await searchController.search(
    parseSearchRequestQuery({
      query: '  atomic  ',
      page: '1',
      pageSize: '20',
      premiumFlag: 'true',
      sortBy: 'RELEVANCE',
      sortOrder: 'DESC',
    }),
  );
  assert.equal(searchResult.meta.query, 'atomic');
  assert.equal(searchResult.data[0].audiobookId, audiobook.id);

  const progress = await playbackController.saveProgress(
    learnerPrincipal.userId,
    parsePlaybackProgressRequest({
      audiobookId: audiobook.id,
      chapterId: chapter.id,
      positionMs: 120000,
      completed: false,
    }),
  );
  assert.equal(progress.audiobookId, audiobook.id);
  assert.equal(progress.chapterId, chapter.id);
  assert.equal(progress.completed, false);

  const loadedProgress = await playbackController.getProgress(learnerPrincipal.userId, audiobook.id);
  assert.ok(loadedProgress);
  assert.equal(loadedProgress.id, progress.id);
  assert.equal(loadedProgress.positionMs, 120000);

  const auditTrail = await smokeState.contentAuditRepositories.contentAuditRepository.listByEntity(
    'audiobook',
    audiobook.id,
  );
  assert.equal(auditTrail.length, 1);
  assert.equal(auditTrail[0].traceId, 'trace-smoke-1');
});

function createSmokeState() {
  const now = new Date('2026-05-12T00:00:00.000Z');
  const users = new Map<string, AuthUserRow>();
  const sessionsByHash = new Map<string, AuthSessionRow>();
  const audiobooks = new Map<string, AudiobookRow>();
  const chapters = new Map<string, ChapterRow>();
  const audiobookNarrators = new Map<string, AudiobookNarratorRow[]>();
  const authors = new Map<string, { id: string; name: string }>([
    ['author-1', { id: 'author-1', name: 'Ada Lovelace' }],
  ]);
  const progressByKey = new Map<string, PlaybackProgressRow>();
  const auditEntries: ContentAuditEntryRow[] = [];
  const reindexEvents: Array<{ audiobookId: string; reason: string }> = [];

  const adminUser: AuthUserRow = {
    id: 'user-admin',
    email: 'admin@fonos.test',
    passwordHash: hashPassword('Secret123!'),
    displayName: 'Admin One',
    avatarAssetKey: null,
    role: 'admin',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  users.set(adminUser.id, adminUser);

  const authRepositories: AuthRepositoryBundle = {
    userRepository: {
      async findById(id: string) {
        return users.get(id) ?? null;
      },
      async findByEmail(email: string) {
        const normalized = email.trim().toLowerCase();
        return [...users.values()].find((user) => user.email.toLowerCase() === normalized) ?? null;
      },
      async createUser(input) {
        const user: AuthUserRow = {
          id: `user-${users.size + 1}`,
          email: input.email,
          passwordHash: input.passwordHash,
          displayName: input.displayName,
          avatarAssetKey: input.avatarAssetKey ?? null,
          role: input.role ?? 'user',
          isActive: input.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        };
        users.set(user.id, user);
        return user;
      },
    },
    sessionRepository: {
      async createSession(input) {
        const session: AuthSessionRow = {
          id: `session-${sessionsByHash.size + 1}`,
          userId: input.userId,
          refreshTokenHash: input.refreshTokenHash,
          expiresAt: input.expiresAt,
          revokedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        sessionsByHash.set(input.refreshTokenHash, session);
        return session;
      },
      async findActiveByRefreshTokenHash(refreshTokenHash: string) {
        const session = sessionsByHash.get(refreshTokenHash);
        if (!session || session.revokedAt) {
          return null;
        }

        return session;
      },
      async revokeByRefreshTokenHash(refreshTokenHash: string) {
        const session = sessionsByHash.get(refreshTokenHash);
        if (!session || session.revokedAt) {
          return false;
        }

        session.revokedAt = now;
        session.updatedAt = now;
        return true;
      },
    },
  };

  const contentRepositories: ContentRepositoryBundle = {
    audiobookRepository: {
      async findById(id: string) {
        return audiobooks.get(id) ?? null;
      },
      async findPublishedById(id: string) {
        const audiobook = audiobooks.get(id);
        return audiobook?.status === 'published' ? audiobook : null;
      },
      async listPublished({ limit, offset }) {
        return [...audiobooks.values()]
          .filter((audiobook) => audiobook.status === 'published')
          .sort((left, right) => (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0))
          .slice(offset, offset + limit)
          .map((audiobook) => ({
            id: audiobook.id,
            title: audiobook.title,
            description: audiobook.description,
            coverImageAssetKey: audiobook.coverImageAssetKey,
            authorId: audiobook.authorId,
            authorName: authors.get(audiobook.authorId)?.name ?? 'Unknown Author',
            durationSec: audiobook.durationSec,
            status: audiobook.status,
            premiumFlag: audiobook.premiumFlag,
            languageCode: audiobook.languageCode,
            publishedAt: audiobook.publishedAt,
          }));
      },
      async countPublished() {
        return [...audiobooks.values()].filter((audiobook) => audiobook.status === 'published').length;
      },
      async createAudiobook(input) {
        const audiobook: AudiobookRow = {
          id: `book-${audiobooks.size + 1}`,
          title: input.title,
          description: input.description,
          coverImageAssetKey: input.coverImageAssetKey,
          authorId: input.authorId,
          durationSec: input.durationSec,
          status: 'draft',
          premiumFlag: input.premiumFlag,
          languageCode: input.languageCode,
          publishedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        audiobooks.set(audiobook.id, audiobook);
        audiobookNarrators.set(audiobook.id, [
          {
            id: `an-${audiobook.id}`,
            audiobookId: audiobook.id,
            narratorId: 'narrator-1',
            roleIndex: 1,
            isPrimary: true,
            createdAt: now,
            updatedAt: now,
          },
        ]);
        return audiobook;
      },
      async updateAudiobook(input) {
        const current = audiobooks.get(input.id);
        if (!current) {
          throw new Error(`Audiobook ${input.id} not found`);
        }

        const next: AudiobookRow = {
          ...current,
          title: input.title,
          description: input.description,
          coverImageAssetKey: input.coverImageAssetKey,
          authorId: input.authorId,
          durationSec: input.durationSec,
          premiumFlag: input.premiumFlag,
          languageCode: input.languageCode,
          updatedAt: now,
        };
        audiobooks.set(next.id, next);
        return next;
      },
      async publishAudiobook(id: string) {
        const current = audiobooks.get(id);
        if (!current) {
          throw new Error(`Audiobook ${id} not found`);
        }

        const next: AudiobookRow = {
          ...current,
          status: 'published',
          publishedAt: current.publishedAt ?? now,
          updatedAt: now,
        };
        audiobooks.set(next.id, next);
        return next;
      },
      async unpublishAudiobook(id: string) {
        const current = audiobooks.get(id);
        if (!current) {
          throw new Error(`Audiobook ${id} not found`);
        }

        const next: AudiobookRow = {
          ...current,
          status: 'unpublished',
          updatedAt: now,
        };
        audiobooks.set(next.id, next);
        return next;
      },
    },
    chapterRepository: {
      async findByAudiobookId(audiobookId: string) {
        return [...chapters.values()]
          .filter((chapter) => chapter.audiobookId === audiobookId)
          .sort((left, right) => left.orderIndex - right.orderIndex);
      },
      async findById(id: string) {
        return chapters.get(id) ?? null;
      },
      async createChapter(input) {
        const chapter: ChapterRow = {
          id: `chapter-${chapters.size + 1}`,
          audiobookId: input.audiobookId,
          title: input.title,
          orderIndex: input.orderIndex,
          durationSec: input.durationSec,
          audioAssetKey: input.audioAssetKey,
          transcript: input.transcript,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        };
        chapters.set(chapter.id, chapter);
        return chapter;
      },
      async updateChapter(input) {
        const current = chapters.get(input.id);
        if (!current) {
          throw new Error(`Chapter ${input.id} not found`);
        }

        const next: ChapterRow = {
          ...current,
          title: input.title,
          orderIndex: input.orderIndex,
          durationSec: input.durationSec,
          audioAssetKey: input.audioAssetKey,
          transcript: input.transcript,
          updatedAt: now,
        };
        chapters.set(next.id, next);
        return next;
      },
      async publishChapter(id: string) {
        const current = chapters.get(id);
        if (!current) {
          throw new Error(`Chapter ${id} not found`);
        }

        const next: ChapterRow = {
          ...current,
          status: 'published',
          updatedAt: now,
        };
        chapters.set(next.id, next);
        return next;
      },
      async unpublishChapter(id: string) {
        const current = chapters.get(id);
        if (!current) {
          throw new Error(`Chapter ${id} not found`);
        }

        const next: ChapterRow = {
          ...current,
          status: 'draft',
          updatedAt: now,
        };
        chapters.set(next.id, next);
        return next;
      },
    },
    audiobookNarratorRepository: {
      async findByAudiobookId(audiobookId: string) {
        return audiobookNarrators.get(audiobookId) ?? [];
      },
      async findDetailedByAudiobookId(audiobookId: string) {
        return (audiobookNarrators.get(audiobookId) ?? []).map((item) => ({
          ...item,
          narratorName: 'Narrator One',
        }));
      },
    },
    authorRepository: {
      async findById(id: string) {
        return authors.get(id) ?? null;
      },
    },
  };

  const contentAuditRepositories: ContentAuditRepositoryBundle = {
    contentAuditRepository: {
      async record(input: ContentAuditRecordInput) {
        const row: ContentAuditEntryRow = {
          id: `audit-${auditEntries.length + 1}`,
          entityType: input.entityType,
          entityId: input.entityId,
          entityTitle: input.entityTitle ?? null,
          action: input.action,
          actorUserId: input.actorUserId ?? null,
          actorRole: input.actorRole ?? null,
          traceId: input.traceId ?? null,
          payloadJson: input.payloadJson ?? {},
          createdAt: now,
        };
        auditEntries.unshift(row);
        return row;
      },
      async listByEntity(entityType: 'audiobook' | 'chapter', entityId: string) {
        return auditEntries.filter((entry) => entry.entityType === entityType && entry.entityId === entityId);
      },
    },
  };

  const playbackRepositories: PlaybackRepositoryBundle = {
    progressRepository: {
      async findByUserAndAudiobookId(userId: string, audiobookId: string) {
        return progressByKey.get(buildProgressKey(userId, audiobookId)) ?? null;
      },
      async upsertProgress(input) {
        const key = buildProgressKey(input.userId, input.audiobookId);
        const next: PlaybackProgressRow = {
          id: progressByKey.get(key)?.id ?? `progress-${progressByKey.size + 1}`,
          userId: input.userId,
          audiobookId: input.audiobookId,
          chapterId: input.chapterId,
          positionMs: input.positionMs,
          completed: input.completed,
          lastPlayedAt: input.lastPlayedAt,
          updatedAt: now,
        };
        progressByKey.set(key, next);
        return next;
      },
    },
  };

  const searchRepositories: SearchRepositoryBundle = {
    searchRepository: {
      async searchPublishedAudiobooks(query: SearchRepositoryQuery): Promise<SearchRepositoryResult> {
        const normalizedQuery = query.query.toLowerCase();
        const matches = [...audiobooks.values()].filter((audiobook) => {
          if (audiobook.status !== 'published') {
            return false;
          }

          if (query.authorId && audiobook.authorId !== query.authorId) {
            return false;
          }

          if (query.premiumFlag !== undefined && audiobook.premiumFlag !== query.premiumFlag) {
            return false;
          }

          const authorName = authors.get(audiobook.authorId)?.name ?? '';
          return [audiobook.title, audiobook.description ?? '', authorName]
            .some((value) => value.toLowerCase().includes(normalizedQuery));
        });

        const data = matches.slice(query.offset, query.offset + query.limit).map((audiobook) => ({
          audiobookId: audiobook.id,
          title: audiobook.title,
          coverImageAssetKey: audiobook.coverImageAssetKey ?? undefined,
          authorName: authors.get(audiobook.authorId)?.name ?? 'Unknown Author',
          narratorNames: (audiobookNarrators.get(audiobook.id) ?? []).map(() => 'Narrator One'),
          categoryNames: [],
          tagNames: [],
          premiumFlag: audiobook.premiumFlag,
          status: 'PUBLISHED' as const,
          score: 100,
          highlight: {
            title: audiobook.title,
          },
        }));

        return {
          data,
          totalItems: matches.length,
        };
      },
    },
  };

  return {
    authRepositories,
    contentRepositories,
    contentAuditRepositories,
    playbackRepositories,
    searchRepositories,
    reindexEvents,
    auditEntries,
  };
}

function buildProgressKey(userId: string, audiobookId: string): string {
  return `${userId}:${audiobookId}`;
}
