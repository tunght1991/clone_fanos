import assert from 'node:assert/strict';
import test from 'node:test';
import { createAudiobookEditorState } from '../src/features/content-editor/content-editor-data.js';
import { renderAudiobookEditorView } from '../src/features/content-editor/content-editor-view.js';

test('renderAudiobookEditorView disables publish action while busy', () => {
  const html = renderAudiobookEditorView({
    state: {
      ...createAudiobookEditorState({
        id: 'ab-001',
        title: 'Demo audiobook',
        authorId: 'author-001',
        authorName: 'Author',
        status: 'draft',
        chapterCount: 2,
      }),
      status: 'publishing',
    },
  });

  assert.match(html, /data-editor-action="publish"/);
  assert.match(html, /data-editor-save/);
  assert.match(html, /disabled/);
});
