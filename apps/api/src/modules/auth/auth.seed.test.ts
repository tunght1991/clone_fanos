import assert from 'node:assert/strict';
import test from 'node:test';

import { ensureDevelopmentAdminUser } from './auth.seed.js';

function createDatabaseMock(existing = false) {
  const calls: Array<{ text: string; params: readonly unknown[] }> = [];

  return {
    calls,
    database: {
      async query(text: string, params: readonly unknown[] = []) {
        calls.push({ text, params });

        if (/SELECT id\s+FROM users/i.test(text)) {
          return {
            rows: existing ? [{ id: 'user-admin' }] : [],
            rowCount: existing ? 1 : 0,
          };
        }

        return {
          rows: [],
          rowCount: 1,
        };
      },
    },
  };
}

test('ensureDevelopmentAdminUser inserts the seeded admin when missing', async () => {
  const { calls, database } = createDatabaseMock(false);

  await ensureDevelopmentAdminUser(database, {
    email: 'admin@fonos.test',
    password: 'Secret123!',
    displayName: 'Admin One',
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0].text, /SELECT id/i);
  assert.match(calls[1].text, /INSERT INTO users/i);
  assert.equal(calls[1].params[0], 'admin@fonos.test');
  assert.equal(calls[1].params[2], 'Admin One');
  assert.match(String(calls[1].params[1]), /^pbkdf2\$/);
});

test('ensureDevelopmentAdminUser updates the seeded admin when it already exists', async () => {
  const { calls, database } = createDatabaseMock(true);

  await ensureDevelopmentAdminUser(database, {
    email: 'admin@fonos.test',
    password: 'Secret123!',
    displayName: 'Admin One',
  });

  assert.equal(calls.length, 2);
  assert.match(calls[1].text, /UPDATE users/i);
  assert.equal(calls[1].params[0], 'admin@fonos.test');
  assert.equal(calls[1].params[2], 'Admin One');
  assert.match(String(calls[1].params[1]), /^pbkdf2\$/);
});
