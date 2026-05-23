import assert from 'node:assert/strict';
import test from 'node:test';

import { CHAPTER_STATUSES, CONTENT_STATUSES, isNarratorRoleIndexValid } from './content.js';

test('content contract keeps audiobook publication statuses stable', () => {
  assert.deepEqual(CONTENT_STATUSES, ['draft', 'published', 'unpublished', 'archived']);
});

test('content contract keeps chapter statuses stable', () => {
  assert.deepEqual(CHAPTER_STATUSES, ['draft', 'ready', 'published', 'archived']);
});

test('content contract accepts narrator role index values between 1 and 3', () => {
  assert.equal(isNarratorRoleIndexValid(1), true);
  assert.equal(isNarratorRoleIndexValid(2), true);
  assert.equal(isNarratorRoleIndexValid(3), true);
});

test('content contract rejects narrator role index values outside 1 to 3', () => {
  assert.equal(isNarratorRoleIndexValid(0), false);
  assert.equal(isNarratorRoleIndexValid(4), false);
  assert.equal(isNarratorRoleIndexValid(1.5), false);
});
