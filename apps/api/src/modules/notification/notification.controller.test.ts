import assert from 'node:assert/strict';
import test from 'node:test';

import { NotificationController } from './notification.controller.js';

test('NotificationController delegates getHome to the service', async () => {
  const controller = new NotificationController({
    async getHome(userId: string) {
      assert.equal(userId, 'user-1');
      return {
        data: {
          resumeReminder: {
            audiobookId: 'book-1',
            chapterId: 'chapter-1',
            title: 'Atomic Habits',
            subtitle: 'Resume Chapter 1 at 02:00',
            progressMs: 120000,
            lastActivityAt: '2026-06-09T00:00:00.000Z',
          },
        },
        meta: {
          generatedAt: '2026-06-09T12:00:00.000Z',
          windowDays: 7,
        },
      };
    },
  } as never);

  const result = await controller.getHome('user-1');

  assert.equal(result.meta.windowDays, 7);
  assert.equal(result.data.resumeReminder?.audiobookId, 'book-1');
});
