import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_AUDIOBOOKS } from '../src/features/content-dashboard/content-dashboard-data.js';
import { renderContentDashboardView } from '../src/features/content-dashboard/content-dashboard-view.js';

test('renderContentDashboardView shows consistent search and filter copy', () => {
  const html = renderContentDashboardView({
    state: {
      filters: {
        query: '',
        status: 'ALL',
        page: 1,
      },
      items: DEMO_AUDIOBOOKS.slice(0, 1),
      meta: {
        totalItems: 1,
        page: 1,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
      source: 'demo',
      loading: false,
      errorMessage: '',
    },
    session: {
      admin: {
        role: 'ADMIN',
      },
    },
  });

  assert.match(html, /Content dashboard/i);
  assert.match(html, /Search, filter, and open the editor for each item/i);
  assert.match(html, /Clear filters/i);
  assert.match(html, /Search by title, author, narrator, or tag/i);
  assert.match(html, /Apply filters/i);
});
