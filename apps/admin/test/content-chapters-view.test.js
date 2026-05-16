import assert from 'node:assert/strict';
import test from 'node:test';
import { createChapterManagerState, listDemoChapters } from '../src/features/content-chapters/content-chapters-data.js';
import { renderChapterManagerView } from '../src/features/content-chapters/content-chapters-view.js';

test('renderChapterManagerView shows chapter list and upload form', () => {
  const state = createChapterManagerState(
    { id: 'ab-001', title: 'Demo audiobook', authorName: 'Author' },
    listDemoChapters('ab-001'),
  );

  const html = renderChapterManagerView({ state });

  assert.match(html, /Chapter manager/i);
  assert.match(html, /Demo audiobook/);
  assert.match(html, /Upload audio/i);
  assert.match(html, /Save chapter/i);
  assert.match(html, /publish/i);
});

test('renderChapterManagerView disables publish actions while busy', () => {
  const state = createChapterManagerState(
    { id: 'ab-001', title: 'Demo audiobook', authorName: 'Author' },
    listDemoChapters('ab-001'),
  );

  const html = renderChapterManagerView({
    state: {
      ...state,
      status: 'publishing',
    },
  });

  assert.match(html, /data-chapter-action="publish"/);
  assert.match(html, /disabled/);
});
