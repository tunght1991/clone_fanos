import { createAdminApi } from '../../api/admin-api.js';
import {
  buildAudiobookEditorDraftFromRecord,
  createAudiobookEditorState,
  createLocalAudiobookId,
  listDemoAudiobookRecords,
  serializeAudiobookEditorPayload,
  upsertAudiobookRecord,
} from './content-editor-data.js';

function normalizeRecord(record) {
  if (!record) {
    return null;
  }

  const state = createAudiobookEditorState(record);
  return {
    ...record,
    ...state.draft,
  };
}

function unwrapAudiobookResponse(response) {
  const wrapperKeys = ['data', 'audiobook', 'record', 'result', 'payload', 'item'];
  const visited = new Set();
  let current = response?.data ?? response;

  while (current && typeof current === 'object' && !Array.isArray(current) && !visited.has(current)) {
    visited.add(current);

    if (current.id != null) {
      return current;
    }

    const nextKey = wrapperKeys.find((key) => current[key] && typeof current[key] === 'object' && !Array.isArray(current[key]));
    if (!nextKey) {
      return current;
    }

    current = current[nextKey];
  }

  return current;
}

export function createAudiobookEditorRepository({
  adminApi = createAdminApi(),
  seedRecords = listDemoAudiobookRecords(),
} = {}) {
  let records = new Map(
    seedRecords
      .map((record) => normalizeRecord(record))
      .filter(Boolean)
      .map((record) => [record.id, record]),
  );

  async function getAudiobook(id) {
    const localRecord = records.get(id);
    if (localRecord) {
      return buildAudiobookEditorDraftFromRecord(localRecord);
    }

    try {
      if (!adminApi.getAudiobook) {
        throw new Error('Admin API getAudiobook is unavailable.');
      }

      const response = await adminApi.getAudiobook(id);
      const record = response?.data ?? response;
      const normalized = normalizeRecord(record);
      if (normalized) {
        records = upsertAudiobookRecord(records, normalized);
        return buildAudiobookEditorDraftFromRecord(normalized);
      }
    } catch {
      // fall through to null
    }

    return null;
  }

  async function saveAudiobook({ mode, id, state }) {
    const payload = serializeAudiobookEditorPayload(state);

    try {
      if (mode === 'create') {
        if (!adminApi.createAudiobook) {
          throw new Error('Admin API createAudiobook is unavailable.');
        }

        const response = await adminApi.createAudiobook(payload);
        const recordFromApi = unwrapAudiobookResponse(response);
        const record = normalizeRecord({
          ...recordFromApi,
          chapterCount: Number.isFinite(Number(recordFromApi?.chapterCount))
            ? Number(recordFromApi.chapterCount)
            : Array.isArray(recordFromApi?.chapters)
              ? recordFromApi.chapters.length
              : Array.isArray(payload.chapters)
                ? payload.chapters.length
                : state.draft.chapterCount,
          chapters: Array.isArray(recordFromApi?.chapters)
            ? recordFromApi.chapters
            : payload.chapters,
        });
        if (record) {
          records = upsertAudiobookRecord(records, record);
          return record;
        }
      } else {
        if (!adminApi.updateAudiobook) {
          throw new Error('Admin API updateAudiobook is unavailable.');
        }

        const response = await adminApi.updateAudiobook(id, payload);
        const record = normalizeRecord(unwrapAudiobookResponse(response));
        if (record) {
          records = upsertAudiobookRecord(records, record);
          return record;
        }
      }
    } catch {
      // fallback to local in-memory store
    }

    const nextId = id || createLocalAudiobookId(Array.from(records.keys()));
    const currentRecord = records.get(nextId) ?? {};
    const nextRecord = normalizeRecord({
      ...currentRecord,
      ...payload,
      id: nextId,
      status: currentRecord.status ?? 'DRAFT',
      publishedAt: currentRecord.publishedAt ?? null,
      chapterCount: currentRecord.chapterCount ?? 0,
      chapters: currentRecord.chapters ?? payload.chapters ?? state.draft.chapters,
      narrators: currentRecord.narrators ?? state.draft.narrators,
      categoryIds: currentRecord.categoryIds ?? state.draft.categoryIds,
      tagIds: currentRecord.tagIds ?? state.draft.tagIds,
      authorName: currentRecord.authorName ?? state.draft.authorName,
      durationSec: payload.durationSec,
      coverImageAssetKey: payload.coverImageAssetKey,
      coverPreviewUrl: state.draft.coverPreviewUrl,
    });

    records = upsertAudiobookRecord(records, nextRecord);
    return nextRecord;
  }

  async function publishAudiobook(id) {
    try {
      if (!adminApi.publishAudiobook) {
        throw new Error('Admin API publishAudiobook is unavailable.');
      }

      const response = await adminApi.publishAudiobook(id);
      const record = normalizeRecord(unwrapAudiobookResponse(response));
      if (record) {
        records = upsertAudiobookRecord(records, record);
        return record;
      }
    } catch {
      // fallback below
    }

    const currentRecord = records.get(id) ?? null;
    if (!currentRecord) {
      return null;
    }

    const nextRecord = normalizeRecord({
      ...currentRecord,
      status: 'PUBLISHED',
      publishedAt: currentRecord.publishedAt ?? new Date().toISOString(),
    });
    records = upsertAudiobookRecord(records, nextRecord);
    return nextRecord;
  }

  async function unpublishAudiobook(id) {
    try {
      if (!adminApi.unpublishAudiobook) {
        throw new Error('Admin API unpublishAudiobook is unavailable.');
      }

      const response = await adminApi.unpublishAudiobook(id);
      const record = normalizeRecord(unwrapAudiobookResponse(response));
      if (record) {
        records = upsertAudiobookRecord(records, record);
        return record;
      }
    } catch {
      // fallback below
    }

    const currentRecord = records.get(id) ?? null;
    if (!currentRecord) {
      return null;
    }

    const nextRecord = normalizeRecord({
      ...currentRecord,
      status: 'UNPUBLISHED',
    });
    records = upsertAudiobookRecord(records, nextRecord);
    return nextRecord;
  }

  function syncRecord(record) {
    const normalized = normalizeRecord(record);
    if (normalized) {
      records = upsertAudiobookRecord(records, normalized);
    }
  }

  function snapshot() {
    return Array.from(records.values());
  }

  return {
    getAudiobook,
    saveAudiobook,
    publishAudiobook,
    unpublishAudiobook,
    syncRecord,
    snapshot,
  };
}
