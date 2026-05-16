import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createBlankChapterDraft,
  createChapterManagerState,
  ensureUniqueOrderIndex,
  listDemoChapters,
  markChapterUploaded,
  reorderChapterRecords,
  validateChapterDraft,
} from '../src/features/content-chapters/content-chapters-data.js';

test('listDemoChapters returns chapters sorted by order', () => {
  const chapters = listDemoChapters('ab-001');

  assert.equal(chapters.length, 3);
  assert.deepEqual(
    chapters.map((chapter) => chapter.orderIndex),
    [1, 2, 3],
  );
});

test('createChapterManagerState seeds the next order from existing chapters', () => {
  const state = createChapterManagerState(
    { id: 'ab-001', title: 'Demo audiobook', authorName: 'Author' },
    listDemoChapters('ab-001'),
  );

  assert.equal(state.selectedChapterId, 'ch-ab-001-001');
  assert.equal(state.draft.orderIndex, 4);
  assert.equal(state.draft.audiobookId, 'ab-001');
});

test('validateChapterDraft rejects duplicate order and missing audio asset key', () => {
  const draft = createBlankChapterDraft('ab-001', 2);
  draft.title = 'New chapter';

  const result = validateChapterDraft(draft, listDemoChapters('ab-001'));

  assert.equal(result.valid, false);
  assert.equal(Boolean(result.errors.orderIndex), true);
  assert.equal(Boolean(result.errors.audioAssetKey), true);
});

test('markChapterUploaded derives a stable audio asset key from the file name', () => {
  const draft = createBlankChapterDraft('ab-001', 1);
  const next = markChapterUploaded(draft, {
    fileName: 'Chapter 01 Final.mp3',
    previewUrl: 'data:audio/mp3;base64,aaa',
  });

  assert.equal(next.audioFileName, 'Chapter 01 Final.mp3');
  assert.equal(next.audioAssetKey, 'audio/ab-001/chapter-01-final');
  assert.equal(next.audioPreviewUrl, 'data:audio/mp3;base64,aaa');
});

test('ensureUniqueOrderIndex skips occupied order values', () => {
  const draft = ensureUniqueOrderIndex(listDemoChapters('ab-002'), {
    id: '',
    orderIndex: 1,
  });

  assert.equal(draft.orderIndex, 3);
});

test('reorderChapterRecords renumbers chapters after moving an item', () => {
  const reordered = reorderChapterRecords(listDemoChapters('ab-001'), 'ch-ab-001-003', 'up');

  assert.deepEqual(
    reordered.map((chapter) => chapter.orderIndex),
    [1, 2, 3],
  );
  assert.equal(reordered[1].id, 'ch-ab-001-003');
});
