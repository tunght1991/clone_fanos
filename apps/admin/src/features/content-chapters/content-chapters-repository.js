import { createAdminApi } from '../../api/admin-api.js';
import {
  createBlankChapterDraft,
  createChapterManagerState,
  createLocalChapterId,
  ensureUniqueOrderIndex,
  listDemoChapters,
  markChapterUploaded,
  normalizeChapterRecord,
  reorderChapterRecords,
  replaceChapterRecord,
  serializeChapterPayload,
  sortChapterRecords,
} from './content-chapters-data.js';

function normalizeChapterRecordOrNull(record, audiobookId) {
  if (!record) {
    return null;
  }

  const normalized = normalizeChapterRecord(record);
  return {
    ...normalized,
    audiobookId: normalized.audiobookId || audiobookId,
  };
}

export function createChapterRepository({
  adminApi = createAdminApi(),
  seedLoader = listDemoChapters,
} = {}) {
  const recordsByAudiobookId = new Map();

  function ensureSeed(audiobookId) {
    if (!recordsByAudiobookId.has(audiobookId)) {
      recordsByAudiobookId.set(
        audiobookId,
        sortChapterRecords(seedLoader(audiobookId).map((chapter) => ({
          ...chapter,
          audiobookId,
        }))),
      );
    }

    return recordsByAudiobookId.get(audiobookId);
  }

  function snapshot(audiobookId) {
    return ensureSeed(audiobookId).map((chapter) => ({ ...chapter }));
  }

  async function listChapters(audiobookId) {
    const local = snapshot(audiobookId);

    try {
      if (!adminApi.listChapters) {
        throw new Error('Admin API listChapters is unavailable.');
      }

      const response = await adminApi.listChapters(audiobookId);
      const apiItems = Array.isArray(response?.data) ? response.data : [];
      const normalized = apiItems
        .map((chapter) => normalizeChapterRecordOrNull(chapter, audiobookId))
        .filter(Boolean);

      if (normalized.length > 0) {
        recordsByAudiobookId.set(audiobookId, sortChapterRecords(normalized));
        return snapshot(audiobookId);
      }
    } catch {
      // fallback to local seed
    }

    return local;
  }

  async function saveChapter({ mode, audiobookId, draft }) {
    const payload = serializeChapterPayload(draft);

    try {
      if (mode === 'create') {
        if (!adminApi.createChapter) {
          throw new Error('Admin API createChapter is unavailable.');
        }

        const response = await adminApi.createChapter({
          audiobookId,
          ...payload,
        });
        const normalized = normalizeChapterRecordOrNull(response?.data ?? response, audiobookId);
        if (normalized) {
          const next = replaceChapterRecord(ensureSeed(audiobookId), normalized);
          recordsByAudiobookId.set(audiobookId, next);
          return normalized;
        }
      } else {
        if (!adminApi.updateChapter) {
          throw new Error('Admin API updateChapter is unavailable.');
        }

        const response = await adminApi.updateChapter(draft.id, payload);
        const normalized = normalizeChapterRecordOrNull(response?.data ?? response, audiobookId);
        if (normalized) {
          const next = replaceChapterRecord(ensureSeed(audiobookId), normalized);
          recordsByAudiobookId.set(audiobookId, next);
          return normalized;
        }
      }
    } catch {
      // fallback to local store
    }

    const current = ensureSeed(audiobookId);
    const chapterId = draft.id || createLocalChapterId(current.map((chapter) => chapter.id));
    const next = normalizeChapterRecord({
      ...draft,
      ...payload,
      id: chapterId,
      audiobookId,
      status: draft.status ?? 'draft',
    });
    const merged = replaceChapterRecord(current, next);
    recordsByAudiobookId.set(audiobookId, merged);
    return next;
  }

  async function uploadChapterAudio({ audiobookId, draft, fileName, previewUrl }) {
    const nextDraft = markChapterUploaded(draft, { fileName, previewUrl });

    try {
      if (draft.id && adminApi.uploadChapterAudio) {
        const response = await adminApi.uploadChapterAudio(draft.id, {
          audioAssetKey: nextDraft.audioAssetKey,
          fileName: nextDraft.audioFileName,
        });
        const normalized = normalizeChapterRecordOrNull(response?.data ?? response, audiobookId);
        if (normalized) {
          const next = replaceChapterRecord(ensureSeed(audiobookId), normalized);
          recordsByAudiobookId.set(audiobookId, next);
          return normalized;
        }
      }
    } catch {
      // fallback below
    }

    if (!draft.id) {
      return nextDraft;
    }

    const next = normalizeChapterRecord(nextDraft);
    recordsByAudiobookId.set(
      audiobookId,
      replaceChapterRecord(ensureSeed(audiobookId), next),
    );
    return next;
  }

  async function publishChapter(audiobookId, chapterId, published) {
    try {
      if (published && adminApi.publishChapter) {
        await adminApi.publishChapter(chapterId);
      }

      if (!published && adminApi.unpublishChapter) {
        await adminApi.unpublishChapter(chapterId);
      }
    } catch {
      // local fallback below
    }

    const chapters = ensureSeed(audiobookId).map((chapter) =>
      chapter.id === chapterId
        ? {
            ...chapter,
            status: published ? 'published' : 'draft',
            publishedAt: published ? chapter.publishedAt ?? new Date().toISOString() : null,
          }
        : chapter,
    );

    recordsByAudiobookId.set(audiobookId, chapters);
    return snapshot(audiobookId).find((chapter) => chapter.id === chapterId) ?? null;
  }

  function reorderChapter(audiobookId, chapterId, direction) {
    const reordered = reorderChapterRecords(ensureSeed(audiobookId), chapterId, direction);
    recordsByAudiobookId.set(audiobookId, reordered);
    return snapshot(audiobookId);
  }

  function getChapter(audiobookId, chapterId) {
    return snapshot(audiobookId).find((chapter) => chapter.id === chapterId) ?? null;
  }

  function getInitialState(audiobook) {
    return createChapterManagerState(audiobook, snapshot(audiobook?.id ?? ''));
  }

  function ensureDraftOrder(audiobookId, draft) {
    return ensureUniqueOrderIndex(snapshot(audiobookId), draft);
  }

  function seedChapters(audiobookId, chapters) {
    const normalized = sortChapterRecords(
      (Array.isArray(chapters) ? chapters : []).map((chapter) => ({
        ...chapter,
        audiobookId,
      })),
    );
    recordsByAudiobookId.set(audiobookId, normalized);
    return snapshot(audiobookId);
  }

  return {
    listChapters,
    saveChapter,
    uploadChapterAudio,
    publishChapter,
    reorderChapter,
    getChapter,
    getInitialState,
    ensureDraftOrder,
    seedChapters,
  };
}
