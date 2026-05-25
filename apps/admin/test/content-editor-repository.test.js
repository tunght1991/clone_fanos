import assert from 'node:assert/strict';
import test from 'node:test';
import { createAudiobookEditorRepository } from '../src/features/content-editor/content-editor-repository.js';
import { createAudiobookEditorState, updateAudiobookEditorField } from '../src/features/content-editor/content-editor-data.js';

test('content editor repository publishes and unpublishes audiobooks locally when API is missing', async () => {
  const repository = createAudiobookEditorRepository({ adminApi: {} });
  const published = await repository.publishAudiobook('ab-002');

  assert.equal(published.status, 'PUBLISHED');

  const unpublished = await repository.unpublishAudiobook('ab-002');

  assert.equal(unpublished.status, 'UNPUBLISHED');
});

test('content editor repository uses create audiobook response chapter metadata', async () => {
  const repository = createAudiobookEditorRepository({
    adminApi: {
      async createAudiobook(payload) {
        assert.equal(payload.chapters.length, 1);
        return {
          data: {
            id: 'ab-api-001',
            title: 'API Book',
            description: null,
            coverImageAssetKey: null,
            authorId: 'author-1',
            authorName: 'Author 1',
            durationSec: 0,
            premiumFlag: false,
            languageCode: 'vi',
            status: 'DRAFT',
            publishedAt: null,
            chapterCount: 2,
            chapters: [
              {
                id: 'chapter-1',
                title: 'Intro',
                orderIndex: 1,
                durationSec: 120,
                audioAssetKey: 'chapters/intro.mp3',
                transcript: null,
                status: 'draft',
              },
              {
                id: 'chapter-2',
                title: 'Middle',
                orderIndex: 2,
                durationSec: 240,
                audioAssetKey: 'chapters/middle.mp3',
                transcript: null,
                status: 'draft',
              },
            ],
            narrators: [],
            categoryIds: [],
            tagIds: [],
          },
        };
      },
    },
  });

  const state = updateAudiobookEditorField(createAudiobookEditorState(), 'title', 'API Book');
  state.draft.authorId = 'author-1';
  state.draft.chapters = [
    {
      title: 'Payload chapter',
      orderIndex: 1,
      durationSec: 60,
      audioAssetKey: 'chapters/payload.mp3',
      transcript: '',
    },
  ];

  const saved = await repository.saveAudiobook({ mode: 'create', id: '', state });

  assert.equal(saved.id, 'ab-api-001');
  assert.equal(saved.chapterCount, 2);
  assert.equal(saved.chapters.length, 2);
  assert.equal(saved.chapters[0].title, 'Intro');
  assert.equal(saved.chapters[1].title, 'Middle');
});

test('content editor repository derives chapter count from local create payload when API is unavailable', async () => {
  const repository = createAudiobookEditorRepository({ adminApi: {} });

  const state = updateAudiobookEditorField(createAudiobookEditorState(), 'title', 'Local Book');
  state.draft.authorId = 'author-1';
  state.draft.chapters = [
    {
      title: 'Local Intro',
      orderIndex: 1,
      durationSec: 60,
      audioAssetKey: 'chapters/local-intro.mp3',
      transcript: '',
    },
    {
      title: 'Local Middle',
      orderIndex: 2,
      durationSec: 90,
      audioAssetKey: 'chapters/local-middle.mp3',
      transcript: '',
    },
  ];

  const saved = await repository.saveAudiobook({ mode: 'create', id: '', state });

  assert.equal(saved.chapterCount, 2);
  assert.equal(saved.chapters.length, 2);
});

test('content editor repository unwraps nested create audiobook responses with an id', async () => {
  const repository = createAudiobookEditorRepository({
    adminApi: {
      async createAudiobook() {
        return {
          data: {
            data: {
              id: 'ab-api-002',
              title: 'Wrapped Book',
              description: null,
              coverImageAssetKey: null,
              authorId: 'author-1',
              authorName: 'Author 1',
              durationSec: 0,
              premiumFlag: false,
              languageCode: 'vi',
              status: 'DRAFT',
              publishedAt: null,
              chapterCount: 0,
              chapters: [],
              narrators: [],
              categoryIds: [],
              tagIds: [],
            },
          },
        };
      },
    },
  });

  const state = updateAudiobookEditorField(createAudiobookEditorState(), 'title', 'Wrapped Book');
  state.draft.authorId = 'author-1';

  const saved = await repository.saveAudiobook({ mode: 'create', id: '', state });

  assert.equal(saved.id, 'ab-api-002');
  assert.equal(saved.title, 'Wrapped Book');
});

test('content editor repository unwraps deeply nested create audiobook responses with an id', async () => {
  const repository = createAudiobookEditorRepository({
    adminApi: {
      async createAudiobook() {
        return {
          data: {
            result: {
              data: {
                audiobook: {
                  data: {
                    id: 'ab-api-003',
                    title: 'Deeply Wrapped Book',
                    description: null,
                    coverImageAssetKey: null,
                    authorId: 'author-1',
                    authorName: 'Author 1',
                    durationSec: 0,
                    premiumFlag: false,
                    languageCode: 'vi',
                    status: 'DRAFT',
                    publishedAt: null,
                    chapterCount: 0,
                    chapters: [],
                    narrators: [],
                    categoryIds: [],
                    tagIds: [],
                  },
                },
              },
            },
          },
        };
      },
    },
  });

  const state = updateAudiobookEditorField(createAudiobookEditorState(), 'title', 'Deeply Wrapped Book');
  state.draft.authorId = 'author-1';

  const saved = await repository.saveAudiobook({ mode: 'create', id: '', state });

  assert.equal(saved.id, 'ab-api-003');
  assert.equal(saved.title, 'Deeply Wrapped Book');
});
