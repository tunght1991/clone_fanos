import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdminApi } from '../src/api/admin-api.js';

function createJsonResponse(payload = { data: { id: 'ok' } }) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    async json() {
      return payload;
    },
    async text() {
      return '';
    },
  };
}

test('createAdminApi attaches bearer auth to protected admin requests', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return createJsonResponse();
  };

  const api = createAdminApi({
    baseUrl: 'http://localhost:3000',
    fetchImpl,
    getAccessToken: () => 'access-1',
  });

  await api.getAudiobook('ab-1');
  await api.listAudiobooks({ page: 1, pageSize: 20, query: 'demo' });
  await api.listChapters('ab-1');
  await api.listAuthors();
  await api.listCategories();
  await api.listTags();
  await api.listNarrators();
  await api.listAuditTrails({ entityType: 'audiobook', entityId: 'ab-1' });
  await api.createAudiobook({
    title: 'Book',
    authorId: 'author-1',
  });
  await api.updateAudiobook('ab-1', {
    title: 'Book',
    authorId: 'author-1',
  });
  await api.publishAudiobook('ab-1');
  await api.unpublishAudiobook('ab-1');
  await api.createChapter({
    audiobookId: 'ab-1',
    title: 'Chapter 1',
    orderIndex: 1,
    durationSec: 120,
    audioAssetKey: 'audio/ab-1/ch-1.mp3',
    transcript: null,
  });
  await api.updateChapter('ch-1', {
    title: 'Chapter 1',
    orderIndex: 1,
    durationSec: 120,
    audioAssetKey: 'audio/ab-1/ch-1.mp3',
    transcript: null,
  });
  await api.uploadChapterAudio('ch-1', {
    audioAssetKey: 'audio/ab-1/ch-1.mp3',
    fileName: 'ch-1.mp3',
  });
  await api.publishChapter('ch-1');
  await api.unpublishChapter('ch-1');
  await api.createAuthor({ name: 'Author 1', description: null, isActive: true });
  await api.updateAuthor('author-1', { name: 'Author 1', description: null, isActive: true });
  await api.deleteAuthor('author-1');
  await api.createCategory({ name: 'Category 1', description: null, isActive: true });
  await api.updateCategory('category-1', { name: 'Category 1', description: null, isActive: true });
  await api.deleteCategory('category-1');
  await api.createTag({ name: 'Tag 1', description: null, isActive: true });
  await api.updateTag('tag-1', { name: 'Tag 1', description: null, isActive: true });
  await api.deleteTag('tag-1');
  await api.createNarrator({ name: 'Narrator 1', description: null, isActive: true });
  await api.updateNarrator('narrator-1', { name: 'Narrator 1', description: null, isActive: true });
  await api.deleteNarrator('narrator-1');
  await api.recordAuditTrail({
    entityType: 'audiobook',
    entityId: 'ab-1',
    entityTitle: 'Book',
    action: 'publish',
    actorUserId: 'user-1',
    actorRole: 'ADMIN',
    payloadJson: { status: 'published' },
  });
  await api.logout('access-1', 'refresh-1');
  await api.getMe('access-1');
  await api.getAdminMe('access-1');

  assert.equal(calls.length, 33);
  for (const call of calls) {
    assert.equal(call.init.headers.Authorization, 'Bearer access-1');
  }
});

test('createAdminApi keeps login and refresh unauthenticated', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return createJsonResponse();
  };

  const api = createAdminApi({
    baseUrl: 'http://localhost:3000',
    fetchImpl,
    getAccessToken: () => 'access-1',
  });

  await api.login({ email: 'admin@fonos.test', password: 'Secret123!' });
  await api.refresh('refresh-1');

  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.equal(calls[1].init.headers.Authorization, undefined);
});
