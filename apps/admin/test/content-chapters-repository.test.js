import assert from 'node:assert/strict';
import test from 'node:test';
import { createChapterRepository } from '../src/features/content-chapters/content-chapters-repository.js';

test('chapter repository publishes and unpublishes chapters locally when API is missing', async () => {
  const repository = createChapterRepository({ adminApi: {} });
  const published = await repository.publishChapter('ab-001', 'ch-ab-001-002', true);

  assert.equal(published.status, 'published');

  const unpublished = await repository.publishChapter('ab-001', 'ch-ab-001-002', false);

  assert.equal(unpublished.status, 'draft');
});
