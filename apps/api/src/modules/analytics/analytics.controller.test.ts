import assert from 'node:assert/strict';
import test from 'node:test';

import { AnalyticsController } from './analytics.controller.js';
import type { AnalyticsService } from './analytics.service.js';

test('AnalyticsController delegates ingest to the service', async () => {
  const controller = new AnalyticsController({
    async ingest(userId, request) {
      assert.equal(userId, 'user-1');
      assert.equal(request.events.length, 1);
      return {
        acceptedCount: 1,
        eventNames: ['app_opened'],
      };
    },
  } as AnalyticsService);

  const result = await controller.ingest('user-1', {
    events: [
      {
        eventName: 'app_opened',
        sourcePlatform: 'ios',
      },
    ],
  });

  assert.equal(result.acceptedCount, 1);
});

