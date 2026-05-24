import assert from 'node:assert/strict';
import test from 'node:test';

import { PostgresAudiobookRepository } from './content.repository.js';

test('PostgresAudiobookRepository listPublished qualifies audiobook columns in joined query', async () => {
  let capturedQuery = '';
  let capturedParams = [];

  const database = {
    async query(text, params) {
      capturedQuery = text;
      capturedParams = params ?? [];
      return {
        rows: [],
      };
    },
  };

  const repository = new PostgresAudiobookRepository(database);
  await repository.listPublished({ limit: 20, offset: 40 });

  assert.match(capturedQuery, /audiobooks\.id/);
  assert.match(capturedQuery, /audiobooks\.status/);
  assert.match(capturedQuery, /ORDER BY audiobooks\.published_at DESC NULLS LAST, audiobooks\.created_at DESC/);
  assert.deepEqual(capturedParams, [20, 40]);
});
