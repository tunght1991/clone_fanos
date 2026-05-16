import assert from 'node:assert/strict';
import test from 'node:test';
import { createAudiobookEditorRepository } from '../src/features/content-editor/content-editor-repository.js';

test('content editor repository publishes and unpublishes audiobooks locally when API is missing', async () => {
  const repository = createAudiobookEditorRepository({ adminApi: {} });
  const published = await repository.publishAudiobook('ab-002');

  assert.equal(published.status, 'PUBLISHED');

  const unpublished = await repository.unpublishAudiobook('ab-002');

  assert.equal(unpublished.status, 'UNPUBLISHED');
});
