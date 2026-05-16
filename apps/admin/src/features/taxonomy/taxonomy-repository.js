import { createAdminApi } from '../../api/admin-api.js';
import {
  buildTaxonomyDraftFromRecord,
  createBlankTaxonomyDraft,
  createTaxonomyManagerState,
  deleteTaxonomyRecord,
  filterTaxonomyRecords,
  listDemoTaxonomyRecords,
  normalizeTaxonomyRecord,
  serializeTaxonomyPayload,
  upsertTaxonomyRecord,
  withTaxonomyQuery,
} from './taxonomy-data.js';

const TYPE_METHODS = {
  author: {
    list: 'listAuthors',
    create: 'createAuthor',
    update: 'updateAuthor',
    delete: 'deleteAuthor',
  },
  category: {
    list: 'listCategories',
    create: 'createCategory',
    update: 'updateCategory',
    delete: 'deleteCategory',
  },
  tag: {
    list: 'listTags',
    create: 'createTag',
    update: 'updateTag',
    delete: 'deleteTag',
  },
  narrator: {
    list: 'listNarrators',
    create: 'createNarrator',
    update: 'updateNarrator',
    delete: 'deleteNarrator',
  },
};

function normalizeType(type) {
  return ['author', 'category', 'tag', 'narrator'].includes(String(type ?? '').toLowerCase())
    ? String(type ?? '').toLowerCase()
    : 'author';
}

function resolveMethod(adminApi, type, action) {
  const methods = TYPE_METHODS[normalizeType(type)];
  const methodName = methods?.[action];
  return methodName && typeof adminApi?.[methodName] === 'function'
    ? adminApi[methodName].bind(adminApi)
    : null;
}

function normalizeOrNull(type, record) {
  if (!record) {
    return null;
  }

  return normalizeTaxonomyRecord(type, record);
}

export function createTaxonomyRepository({
  adminApi = createAdminApi(),
  seedLoader = listDemoTaxonomyRecords,
} = {}) {
  const recordsByType = new Map();

  function ensureSeed(type) {
    const normalizedType = normalizeType(type);
    if (!recordsByType.has(normalizedType)) {
      recordsByType.set(
        normalizedType,
        seedLoader(normalizedType).map((record) => normalizeTaxonomyRecord(normalizedType, record)),
      );
    }

    return recordsByType.get(normalizedType);
  }

  function snapshot(type) {
    return ensureSeed(type).map((record) => ({ ...record }));
  }

  async function listTaxonomy(type, query = '') {
    const normalizedType = normalizeType(type);

    try {
      const listMethod = resolveMethod(adminApi, normalizedType, 'list');
      if (!listMethod) {
        throw new Error(`Admin API list method unavailable for ${normalizedType}.`);
      }

      const response = await listMethod();
      const items = Array.isArray(response?.data) ? response.data : [];
      const normalizedItems = items
        .map((record) => normalizeOrNull(normalizedType, record))
        .filter(Boolean);

      if (normalizedItems.length > 0) {
        recordsByType.set(normalizedType, normalizedItems);
      }
    } catch {
      // fallback to local seed
    }

    return filterTaxonomyRecords(snapshot(normalizedType), query);
  }

  async function saveTaxonomy({ type, mode, draft }) {
    const normalizedType = normalizeType(type);
    const payload = serializeTaxonomyPayload(draft);

    try {
      const methodName = mode === 'create' ? 'create' : 'update';
      const method = resolveMethod(adminApi, normalizedType, methodName);
      if (!method) {
        throw new Error(`Admin API ${methodName} method unavailable for ${normalizedType}.`);
      }

      const response = mode === 'create'
        ? await method(payload)
        : await method(draft.id, payload);
      const normalized = normalizeOrNull(normalizedType, response?.data ?? response);

      if (normalized) {
        const next = upsertTaxonomyRecord(ensureSeed(normalizedType), {
          ...normalized,
          type: normalizedType,
        });
        recordsByType.set(normalizedType, next);
        return normalized;
      }
    } catch {
      // fallback below
    }

    const current = ensureSeed(normalizedType);
    const nextRecord = normalizeTaxonomyRecord(normalizedType, {
      ...draft,
      ...payload,
      id: draft.id || `${normalizedType}-local-${String(current.length + 1).padStart(3, '0')}`,
      type: normalizedType,
      usageCount: draft.usageCount ?? 0,
    });
    recordsByType.set(normalizedType, upsertTaxonomyRecord(current, nextRecord));
    return nextRecord;
  }

  async function deleteTaxonomy({ type, id }) {
    const normalizedType = normalizeType(type);

    try {
      const method = resolveMethod(adminApi, normalizedType, 'delete');
      if (method) {
        await method(id);
      }
    } catch {
      // fallback below
    }

    const next = deleteTaxonomyRecord(ensureSeed(normalizedType), id);
    recordsByType.set(normalizedType, next);
    return snapshot(normalizedType);
  }

  function getTaxonomy(type, id) {
    const normalizedType = normalizeType(type);
    return snapshot(normalizedType).find((record) => record.id === id) ?? null;
  }

  function getInitialState(type, records = []) {
    return createTaxonomyManagerState(type, records.length > 0 ? records : snapshot(type));
  }

  function buildDraft(type, record) {
    return buildTaxonomyDraftFromRecord(record, type);
  }

  function setQuery(type, query) {
    const nextState = createTaxonomyManagerState(type, snapshot(type));
    return withTaxonomyQuery(nextState, query);
  }

  function resetType(type) {
    const normalizedType = normalizeType(type);
    recordsByType.set(normalizedType, seedLoader(normalizedType).map((record) => normalizeTaxonomyRecord(normalizedType, record)));
    return snapshot(normalizedType);
  }

  return {
    listTaxonomy,
    saveTaxonomy,
    deleteTaxonomy,
    getTaxonomy,
    getInitialState,
    buildDraft,
    setQuery,
    resetType,
    createBlankTaxonomyDraft,
    filterTaxonomyRecords,
  };
}
