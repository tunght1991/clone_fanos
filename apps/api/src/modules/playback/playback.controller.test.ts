import assert from 'node:assert/strict';
import test from 'node:test';

import { PlaybackController } from './playback.controller.js';
import type { PlaybackService } from './playback.service.js';

function createPlaybackServiceStub(): PlaybackService {
  return {
    async saveProgress(userId: string, request) {
      return {
        id: 'progress-1',
        userId,
        audiobookId: request.audiobookId,
        chapterId: request.chapterId,
        positionMs: request.positionMs,
        completed: request.completed ?? false,
        lastPlayedAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      };
    },
    async getProgress(userId: string, audiobookId: string) {
      return audiobookId === 'book-1'
        ? {
            id: 'progress-1',
            userId,
            audiobookId,
            chapterId: 'chapter-1',
            positionMs: 5000,
            completed: false,
            lastPlayedAt: '2026-05-11T00:00:00.000Z',
            updatedAt: '2026-05-11T00:00:00.000Z',
          }
        : null;
    },
  } as PlaybackService;
}

test('PlaybackController delegates saveProgress to the service', async () => {
  const controller = new PlaybackController(createPlaybackServiceStub());

  const result = await controller.saveProgress('user-1', {
    audiobookId: 'book-1',
    chapterId: 'chapter-1',
    positionMs: 1200,
  });

  assert.equal(result.userId, 'user-1');
  assert.equal(result.audiobookId, 'book-1');
});

test('PlaybackController delegates getProgress to the service', async () => {
  const controller = new PlaybackController(createPlaybackServiceStub());

  const result = await controller.getProgress('user-1', 'book-1');

  assert.ok(result);
  assert.equal(result?.chapterId, 'chapter-1');
});

