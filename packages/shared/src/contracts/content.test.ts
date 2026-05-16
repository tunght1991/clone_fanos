import assert from 'node:assert/strict';
import test from 'node:test';

import { CHAPTER_STATUSES, CONTENT_STATUSES } from './content.js';

test('content contract keeps audiobook publication statuses stable', () => {
  assert.deepEqual(CONTENT_STATUSES, ['draft', 'published', 'unpublished', 'archived']);
});

test('content contract keeps chapter statuses stable', () => {
  assert.deepEqual(CHAPTER_STATUSES, ['draft', 'ready', 'published', 'archived']);
});
