import assert from 'node:assert/strict';
import test from 'node:test';

import { SEARCH_SORT_BYS, SEARCH_SORT_ORDERS } from './search.js';

test('search contract keeps sort-by values stable', () => {
  assert.deepEqual(SEARCH_SORT_BYS, ['RELEVANCE', 'CREATED_AT', 'POPULARITY']);
});

test('search contract keeps sort-order values stable', () => {
  assert.deepEqual(SEARCH_SORT_ORDERS, ['ASC', 'DESC']);
});
