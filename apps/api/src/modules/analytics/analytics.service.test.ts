import assert from 'node:assert/strict';
import test from 'node:test';

import { AnalyticsService } from './analytics.service.js';

test('AnalyticsService ingests a batch of events for a user', async () => {
  const calls: Array<{ eventName: string }> = [];
  const service = new AnalyticsService({
    repositories: {
      analyticsRepository: {
        async recordEvent(input) {
          calls.push({ eventName: input.eventName });
          return {
            id: 'event-1',
            userId: input.userId,
            eventName: input.eventName,
            payloadJson: input.payloadJson,
            sourcePlatform: input.sourcePlatform,
            createdAt: input.occurredAt,
          };
        },
      },
    },
  });

  const result = await service.ingest('user-1', {
    events: [
      {
        eventName: 'app_opened',
        sourcePlatform: 'ios',
        payload: { screen: 'home' },
      },
      {
        eventName: 'audiobook_viewed',
        sourcePlatform: 'ios',
        payload: { audiobookId: 'book-1' },
      },
    ],
  });

  assert.equal(result.acceptedCount, 2);
  assert.deepEqual(result.eventNames, ['app_opened', 'audiobook_viewed']);
  assert.equal(calls.length, 2);
});

test('AnalyticsService rejects empty batches', async () => {
  const service = new AnalyticsService({
    repositories: {
      analyticsRepository: {
        async recordEvent() {
          throw new Error('not expected');
        },
      },
    },
  });

  await assert.rejects(() => service.ingest('user-1', { events: [] }), /At least one analytics event is required/i);
});

