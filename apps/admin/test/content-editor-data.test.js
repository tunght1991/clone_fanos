import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAudiobookEditorDraftFromRecord,
  createAudiobookEditorState,
  createBlankAudiobookEditorDraft,
  createLocalAudiobookId,
  getEditorPublishWarning,
  serializeAudiobookEditorPayload,
  toggleAudiobookEditorCategory,
  toggleAudiobookEditorTag,
  updateAudiobookEditorAuthor,
  updateAudiobookEditorCover,
  updateAudiobookEditorField,
  updateAudiobookEditorNarratorSlot,
  validateAudiobookEditorState,
} from '../src/features/content-editor/content-editor-data.js';

test('createBlankAudiobookEditorDraft returns a new empty editor draft', () => {
  const draft = createBlankAudiobookEditorDraft();

  assert.equal(draft.title, '');
  assert.equal(draft.authorId, '');
  assert.equal(draft.narrators.length, 3);
  assert.equal(draft.languageCode, 'vi');
});

test('buildAudiobookEditorDraftFromRecord hydrates published metadata and taxonomy state', () => {
  const draft = buildAudiobookEditorDraftFromRecord({
    id: 'ab-001',
    title: 'Tư duy hệ thống cho người bận rộn',
    description: 'Demo description',
    coverImageAssetKey: 'covers/system-thinking.jpg',
    authorId: 'author-001',
    authorName: 'Nguyễn Hoàng',
    durationSec: 3840,
    premiumFlag: true,
    languageCode: 'vi',
    status: 'published',
    publishedAt: '2026-05-11T00:00:00.000Z',
    chapterCount: 12,
    narrators: [{ id: 'narrator-001', name: 'Lan Anh', roleIndex: 1, isPrimary: true }],
    categoryIds: ['category-business'],
    tagIds: ['tag-habit'],
  });

  assert.equal(draft.id, 'ab-001');
  assert.equal(draft.authorName, 'Nguyễn Hoàng');
  assert.equal(draft.narrators[0].narratorName, 'Lan Anh');
  assert.deepEqual(draft.categoryIds, ['category-business']);
  assert.deepEqual(draft.tagIds, ['tag-habit']);
});

test('validateAudiobookEditorState rejects missing title and author', () => {
  const result = validateAudiobookEditorState(createAudiobookEditorState());

  assert.equal(result.valid, false);
  assert.equal(Boolean(result.errors.title), true);
  assert.equal(Boolean(result.errors.authorId), true);
});

test('serializeAudiobookEditorPayload emits contract fields only', () => {
  const state = updateAudiobookEditorCover(
    updateAudiobookEditorAuthor(
      updateAudiobookEditorField(createAudiobookEditorState(), 'title', '  New audiobook  '),
      'author-003',
    ),
    { fileName: 'My Cover Image.png', previewUrl: 'data:image/png;base64,aaa' },
  );

  const payload = serializeAudiobookEditorPayload(state);

  assert.deepEqual(payload, {
    title: 'New audiobook',
    description: null,
    coverImageAssetKey: 'covers/my-cover-image',
    authorId: 'author-003',
    durationSec: 0,
    premiumFlag: false,
    languageCode: 'vi',
  });
});

test('toggle helpers add and remove taxonomy selections', () => {
  const stateWithCategory = toggleAudiobookEditorCategory(createAudiobookEditorState(), 'category-business');
  const stateWithoutCategory = toggleAudiobookEditorCategory(stateWithCategory, 'category-business');
  const stateWithTag = toggleAudiobookEditorTag(createAudiobookEditorState(), 'tag-habit');
  const stateWithoutTag = toggleAudiobookEditorTag(stateWithTag, 'tag-habit');

  assert.deepEqual(stateWithCategory.draft.categoryIds, ['category-business']);
  assert.deepEqual(stateWithoutCategory.draft.categoryIds, []);
  assert.deepEqual(stateWithTag.draft.tagIds, ['tag-habit']);
  assert.deepEqual(stateWithoutTag.draft.tagIds, []);
});

test('updateAudiobookEditorNarratorSlot stores selected narrator in the requested slot', () => {
  const state = updateAudiobookEditorNarratorSlot(createAudiobookEditorState(), 1, 'narrator-004');

  assert.equal(state.draft.narrators[0].narratorId, 'narrator-004');
  assert.equal(state.draft.narrators[0].narratorName, 'Huy');
});

test('createLocalAudiobookId picks the next free local id', () => {
  const id = createLocalAudiobookId(['ab-local-001', 'ab-local-002']);

  assert.equal(id, 'ab-local-003');
});

test('getEditorPublishWarning warns on published content', () => {
  const warning = getEditorPublishWarning({
    status: 'PUBLISHED',
  });

  assert.ok(warning.includes('publish'));
});
