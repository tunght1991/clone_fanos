import assert from 'node:assert/strict';
import test from 'node:test';

import { RetentionController } from './retention.controller.js';

test('RetentionController delegates getHome to the service', async () => {
  const controller = new RetentionController({
    async getHome(userId: string) {
      return {
        data: {
          weeklySummary: {
            periodStart: '2026-06-02T00:00:00.000Z',
            periodEnd: '2026-06-09T00:00:00.000Z',
            headline: 'Your habit is sticking',
            description: '3 active titles',
            activeDays: 3,
            listeningSessions: 1,
            bookmarksCreated: 1,
            notesCreated: 1,
            favoritesAdded: 1,
            topAudiobookTitle: 'Atomic Habits',
            topAuthorName: 'James Clear',
            lastActivityAt: '2026-06-09T00:00:00.000Z',
          },
          recommendations: [
            {
              audiobookId: 'book-4',
              title: 'Deep Work 2',
              description: null,
              coverImageAssetKey: null,
              authorId: 'author-3',
              authorName: 'Cal Newport',
              durationSec: 5100,
              premiumFlag: false,
              status: 'published',
              publishedAt: '2026-06-03T00:00:00.000Z',
              reasonType: 'MORE_FROM_AUTHOR',
              reason: 'More from Cal Newport',
            },
          ],
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
  assert.equal(result.data.recommendations[0]?.audiobookId, 'book-4');
});
