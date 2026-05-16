import { requestEnvelopeJson, requestJson } from './http.js';

function authHeaders(accessToken) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
}

export function createAdminApi({ baseUrl = '', fetchImpl = globalThis.fetch.bind(globalThis) } = {}) {
  return {
    getAudiobook(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}`);
    },
    listAudiobooks(params = {}) {
      const searchParams = new URLSearchParams();

      if (params.query) {
        searchParams.set('query', params.query);
      }

      if (params.status && params.status !== 'ALL') {
        searchParams.set('status', params.status);
      }

      if (params.page) {
        searchParams.set('page', String(params.page));
      }

      if (params.pageSize) {
        searchParams.set('pageSize', String(params.pageSize));
      }

      if (params.sortBy) {
        searchParams.set('sortBy', params.sortBy);
      }

      if (params.sortOrder) {
        searchParams.set('sortOrder', params.sortOrder);
      }

      const queryString = searchParams.toString();
      return requestEnvelopeJson(
        fetchImpl,
        baseUrl,
        `/admin/audiobooks${queryString ? `?${queryString}` : ''}`,
      );
    },
    login(credentials) {
      return requestJson(fetchImpl, baseUrl, '/auth/login', {
        method: 'POST',
        body: credentials,
      });
    },
    createAudiobook(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/audiobooks', {
        method: 'POST',
        body: payload,
      });
    },
    updateAudiobook(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}`, {
        method: 'PATCH',
        body: payload,
      });
    },
    publishAudiobook(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}/publish`, {
        method: 'PATCH',
      });
    },
    unpublishAudiobook(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}/unpublish`, {
        method: 'PATCH',
      });
    },
    listChapters(audiobookId) {
      return requestEnvelopeJson(fetchImpl, baseUrl, `/admin/audiobooks/${audiobookId}/chapters`);
    },
    createChapter(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/chapters', {
        method: 'POST',
        body: payload,
      });
    },
    updateChapter(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}`, {
        method: 'PATCH',
        body: payload,
      });
    },
    uploadChapterAudio(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}/audio`, {
        method: 'POST',
        body: payload,
      });
    },
    publishChapter(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}/publish`, {
        method: 'PATCH',
      });
    },
    unpublishChapter(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}/unpublish`, {
        method: 'PATCH',
      });
    },
    listAuthors() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/authors');
    },
    createAuthor(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/authors', {
        method: 'POST',
        body: payload,
      });
    },
    updateAuthor(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/authors/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    deleteAuthor(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/authors/${id}`, {
        method: 'DELETE',
      });
    },
    listCategories() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/categories');
    },
    createCategory(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/categories', {
        method: 'POST',
        body: payload,
      });
    },
    updateCategory(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/categories/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    deleteCategory(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/categories/${id}`, {
        method: 'DELETE',
      });
    },
    listTags() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/tags');
    },
    createTag(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/tags', {
        method: 'POST',
        body: payload,
      });
    },
    updateTag(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/tags/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    deleteTag(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/tags/${id}`, {
        method: 'DELETE',
      });
    },
    listNarrators() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/narrators');
    },
    createNarrator(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/narrators', {
        method: 'POST',
        body: payload,
      });
    },
    updateNarrator(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/narrators/${id}`, {
        method: 'PUT',
        body: payload,
      });
    },
    deleteNarrator(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/narrators/${id}`, {
        method: 'DELETE',
      });
    },
    listAuditTrails(params = {}) {
      const searchParams = new URLSearchParams();

      if (params.entityType) {
        searchParams.set('entityType', params.entityType);
      }

      if (params.entityId) {
        searchParams.set('entityId', params.entityId);
      }

      if (params.query) {
        searchParams.set('query', params.query);
      }

      const queryString = searchParams.toString();
      return requestEnvelopeJson(
        fetchImpl,
        baseUrl,
        `/admin/audit-trails${queryString ? `?${queryString}` : ''}`,
      );
    },
    recordAuditTrail(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/audit-trails', {
        method: 'POST',
        body: payload,
      });
    },
    refresh(refreshToken) {
      return requestJson(fetchImpl, baseUrl, '/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
    },
    logout(accessToken, refreshToken) {
      return requestJson(fetchImpl, baseUrl, '/auth/logout', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: { refreshToken },
      });
    },
    getMe(accessToken) {
      return requestJson(fetchImpl, baseUrl, '/auth/me', {
        headers: authHeaders(accessToken),
      });
    },
    getAdminMe(accessToken) {
      return requestJson(fetchImpl, baseUrl, '/admin/me', {
        headers: authHeaders(accessToken),
      });
    },
  };
}
