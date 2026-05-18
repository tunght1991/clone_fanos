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

test('chapter repository seeds chapter list for a newly created audiobook', async () => {
  const repository = createChapterRepository({ adminApi: {} });

  repository.seedChapters('ab-local-999', [
    {
      id: 'ch-local-999-001',
      title: 'Intro',
      orderIndex: 1,
      durationSec: 180,
      audioAssetKey: 'audio/ab-local-999/intro.mp3',
      transcript: null,
      status: 'draft',
    },
  ]);

  const chapters = await repository.listChapters('ab-local-999');

  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].title, 'Intro');
});
