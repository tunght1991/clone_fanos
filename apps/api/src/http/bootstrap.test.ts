import assert from 'node:assert/strict';
import test from 'node:test';

import { createGracefulShutdownHandler } from './shutdown.js';
import type { ApiRuntime } from '../main.js';

test('createGracefulShutdownHandler closes app and database only once', async () => {
  let appCloseCount = 0;
  let databaseCloseCount = 0;

  const handler = createGracefulShutdownHandler(
    {
      async close() {
        appCloseCount += 1;
      },
    },
    {
      database: {
        async close() {
          databaseCloseCount += 1;
        },
      },
    } as ApiRuntime,
  );

  await handler();
  await handler();

  assert.equal(appCloseCount, 1);
  assert.equal(databaseCloseCount, 1);
});
