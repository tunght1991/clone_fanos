import { requestEnvelopeJson, requestJson } from './http.js';

function authHeaders(accessToken) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
}

export function createAdminApi({
  baseUrl = '',
  fetchImpl = globalThis.fetch.bind(globalThis),
  getAccessToken = () => '',
} = {}) {
  return {
    getAudiobook(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}`, {
        headers: authHeaders(getAccessToken()),
      });
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
        {
          headers: authHeaders(getAccessToken()),
        },
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
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    updateAudiobook(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}`, {
        method: 'PATCH',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    publishAudiobook(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}/publish`, {
        method: 'PATCH',
        headers: authHeaders(getAccessToken()),
      });
    },
    unpublishAudiobook(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/audiobooks/${id}/unpublish`, {
        method: 'PATCH',
        headers: authHeaders(getAccessToken()),
      });
    },
    listChapters(audiobookId) {
      return requestEnvelopeJson(fetchImpl, baseUrl, `/admin/audiobooks/${audiobookId}/chapters`, {
        headers: authHeaders(getAccessToken()),
      });
    },
    createChapter(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/chapters', {
        method: 'POST',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    updateChapter(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}`, {
        method: 'PATCH',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    uploadChapterAudio(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}/audio`, {
        method: 'POST',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    publishChapter(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}/publish`, {
        method: 'PATCH',
        headers: authHeaders(getAccessToken()),
      });
    },
    unpublishChapter(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/chapters/${id}/unpublish`, {
        method: 'PATCH',
        headers: authHeaders(getAccessToken()),
      });
    },
    listAuthors() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/authors', {
        headers: authHeaders(getAccessToken()),
      });
    },
    createAuthor(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/authors', {
        method: 'POST',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    updateAuthor(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/authors/${id}`, {
        method: 'PUT',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    deleteAuthor(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/authors/${id}`, {
        method: 'DELETE',
        headers: authHeaders(getAccessToken()),
      });
    },
    listCategories() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/categories', {
        headers: authHeaders(getAccessToken()),
      });
    },
    createCategory(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/categories', {
        method: 'POST',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    updateCategory(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/categories/${id}`, {
        method: 'PUT',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    deleteCategory(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/categories/${id}`, {
        method: 'DELETE',
        headers: authHeaders(getAccessToken()),
      });
    },
    listTags() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/tags', {
        headers: authHeaders(getAccessToken()),
      });
    },
    createTag(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/tags', {
        method: 'POST',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    updateTag(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/tags/${id}`, {
        method: 'PUT',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    deleteTag(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/tags/${id}`, {
        method: 'DELETE',
        headers: authHeaders(getAccessToken()),
      });
    },
    listNarrators() {
      return requestEnvelopeJson(fetchImpl, baseUrl, '/admin/narrators', {
        headers: authHeaders(getAccessToken()),
      });
    },
    createNarrator(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/narrators', {
        method: 'POST',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    updateNarrator(id, payload) {
      return requestJson(fetchImpl, baseUrl, `/admin/narrators/${id}`, {
        method: 'PUT',
        headers: authHeaders(getAccessToken()),
        body: payload,
      });
    },
    deleteNarrator(id) {
      return requestJson(fetchImpl, baseUrl, `/admin/narrators/${id}`, {
        method: 'DELETE',
        headers: authHeaders(getAccessToken()),
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
        {
          headers: authHeaders(getAccessToken()),
        },
      );
    },
    recordAuditTrail(payload) {
      return requestJson(fetchImpl, baseUrl, '/admin/audit-trails', {
        method: 'POST',
        headers: authHeaders(getAccessToken()),
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
