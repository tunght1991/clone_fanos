import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEMO_AUDIOBOOKS,
  filterContentAudiobooks,
  normalizeContentDashboardFilters,
  paginateContentAudiobooks,
  resolveContentAudiobookById,
} from '../src/features/content-dashboard/content-dashboard-data.js';

test('normalizeContentDashboardFilters defaults invalid query params safely', () => {
  const filters = normalizeContentDashboardFilters({
    query: '  ai  ',
    status: 'invalid-status',
    page: '0',
  });

  assert.deepEqual(filters, {
    query: 'ai',
    status: 'ALL',
    page: 1,
    pageSize: 6,
  });
});

test('filterContentAudiobooks matches query across title, author and tags', () => {
  const result = filterContentAudiobooks(DEMO_AUDIOBOOKS, {
    query: 'habit',
    status: 'ALL',
    page: 1,
  });

  assert.ok(result.some((item) => item.id === 'ab-001'));
  assert.ok(result.some((item) => item.id === 'ab-005'));
});

test('paginateContentAudiobooks returns the requested page and meta', () => {
  const result = paginateContentAudiobooks(DEMO_AUDIOBOOKS, {
    query: '',
    status: 'PUBLISHED',
    page: 1,
  });

  assert.equal(result.meta.status, 'PUBLISHED');
  assert.equal(result.meta.page, 1);
  assert.ok(result.meta.totalItems >= 3);
  assert.ok(result.items.length > 0);
});

test('resolveContentAudiobookById returns null when the item is missing', () => {
  const item = resolveContentAudiobookById(DEMO_AUDIOBOOKS, 'missing-id');

  assert.equal(item, null);
});
