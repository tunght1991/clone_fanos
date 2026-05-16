import {
  DEMO_AUDIOBOOKS,
  normalizeContentDashboardItem,
} from '../content-dashboard/content-dashboard-data.js';
import {
  DEMO_AUTHOR_OPTIONS as TAXONOMY_AUTHOR_OPTIONS,
  DEMO_CATEGORY_OPTIONS as TAXONOMY_CATEGORY_OPTIONS,
  DEMO_NARRATOR_OPTIONS as TAXONOMY_NARRATOR_OPTIONS,
  DEMO_TAG_OPTIONS as TAXONOMY_TAG_OPTIONS,
} from '../taxonomy/taxonomy-data.js';

export const MAX_EDITOR_NARRATORS = 3;
export const DEFAULT_EDITOR_LANGUAGE_CODE = 'vi';

export const DEMO_AUTHOR_OPTIONS = [
  { id: 'author-001', name: 'Nguyễn Hoàng' },
  { id: 'author-002', name: 'Mai Linh' },
  { id: 'author-003', name: 'Trần Nhật' },
  { id: 'author-004', name: 'Lê Vy' },
  { id: 'author-005', name: 'Phạm Quang' },
  { id: 'author-006', name: 'Hoàng An' },
  { id: 'author-007', name: 'Bảo Trân' },
];

export const DEMO_NARRATOR_OPTIONS = [
  { id: 'narrator-001', name: 'Lan Anh' },
  { id: 'narrator-002', name: 'Akira' },
  { id: 'narrator-003', name: 'Minh Thu' },
  { id: 'narrator-004', name: 'Huy' },
  { id: 'narrator-005', name: 'Khánh' },
  { id: 'narrator-006', name: 'Linh' },
  { id: 'narrator-007', name: 'Thu Hà' },
  { id: 'narrator-008', name: 'Hải' },
  { id: 'narrator-009', name: 'Minh' },
];

export const DEMO_CATEGORY_OPTIONS = [
  { id: 'category-business', name: 'Business' },
  { id: 'category-self-development', name: 'Self-development' },
  { id: 'category-japanese', name: 'Japanese' },
  { id: 'category-technology', name: 'Technology' },
  { id: 'category-language', name: 'Language' },
  { id: 'category-management', name: 'Management' },
  { id: 'category-marketing', name: 'Marketing' },
];

export const DEMO_TAG_OPTIONS = [
  { id: 'tag-retention', name: 'retention' },
  { id: 'tag-habit', name: 'habit' },
  { id: 'tag-language', name: 'language' },
  { id: 'tag-daily-practice', name: 'daily-practice' },
  { id: 'tag-ai', name: 'ai' },
  { id: 'tag-productivity', name: 'productivity' },
  { id: 'tag-english', name: 'english' },
  { id: 'tag-routine', name: 'routine' },
  { id: 'tag-discipline', name: 'discipline' },
  { id: 'tag-team', name: 'team' },
  { id: 'tag-leadership', name: 'leadership' },
  { id: 'tag-growth', name: 'growth' },
  { id: 'tag-content', name: 'content' },
];

function normalizeString(value) {
  return String(value ?? '').trim().toLowerCase();
}

function slugifyFileName(fileName) {
  return normalizeString(fileName)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function optionNameById(options, id) {
  return options.find((option) => option.id === id)?.name ?? '';
}

function normalizeNarratorSlots(source) {
  const narrators = Array.isArray(source?.narrators) ? source.narrators : [];
  const slots = Array.from({ length: MAX_EDITOR_NARRATORS }, (_, index) => ({
    roleIndex: index + 1,
    narratorId: '',
    narratorName: '',
  }));

  for (const narrator of narrators) {
    const slotIndex = Number(narrator?.roleIndex ?? 0) - 1;
    if (slotIndex < 0 || slotIndex >= MAX_EDITOR_NARRATORS) {
      continue;
    }

    slots[slotIndex] = {
      roleIndex: slotIndex + 1,
      narratorId: String(narrator?.id ?? narrator?.narratorId ?? ''),
      narratorName: String(
        narrator?.name ?? narrator?.narratorName ?? optionNameById(TAXONOMY_NARRATOR_OPTIONS, narrator?.id ?? narrator?.narratorId),
      ),
    };
  }

  return slots;
}

export function createBlankAudiobookEditorDraft() {
  return {
    id: '',
    title: '',
    description: '',
    coverImageAssetKey: '',
    coverPreviewUrl: '',
    coverFileName: '',
    authorId: '',
    authorName: '',
    durationSec: 0,
    premiumFlag: false,
    languageCode: DEFAULT_EDITOR_LANGUAGE_CODE,
    status: 'DRAFT',
    publishedAt: null,
    chapterCount: 0,
    narrators: normalizeNarratorSlots({}),
    categoryIds: [],
    tagIds: [],
  };
}

export function buildAudiobookEditorDraftFromRecord(record) {
  const normalized = normalizeContentDashboardItem(record ?? {});
  const authorId = String(record?.authorId ?? record?.author?.id ?? '');
  const authorName = String(record?.authorName ?? record?.author?.name ?? optionNameById(TAXONOMY_AUTHOR_OPTIONS, authorId));
  const categoryIds = Array.isArray(record?.categoryIds) ? record.categoryIds.map(String) : [];
  const tagIds = Array.isArray(record?.tagIds) ? record.tagIds.map(String) : [];

  return {
    ...createBlankAudiobookEditorDraft(),
    id: normalized.id,
    title: normalized.title,
    description: String(record?.description ?? ''),
    coverImageAssetKey: String(record?.coverImageAssetKey ?? ''),
    coverPreviewUrl: String(record?.coverPreviewUrl ?? ''),
    coverFileName: '',
    authorId,
    authorName,
    durationSec: Number(record?.durationSec ?? 0),
    premiumFlag: Boolean(record?.premiumFlag),
    languageCode: String(record?.languageCode ?? DEFAULT_EDITOR_LANGUAGE_CODE),
    status: String(record?.status ?? 'DRAFT').toUpperCase(),
    publishedAt: record?.publishedAt ?? null,
    chapterCount: Number(record?.chapterCount ?? 0),
    narrators: normalizeNarratorSlots(record),
    categoryIds,
    tagIds,
  };
}

export function createAudiobookEditorState(record = null) {
  const draft = record ? buildAudiobookEditorDraftFromRecord(record) : createBlankAudiobookEditorDraft();
  return {
    mode: record?.id ? 'edit' : 'create',
    status: 'editing',
    draft,
    ui: {
      authorQuery: draft.authorName || '',
      narratorQueries: {
        1: draft.narrators[0]?.narratorName ?? '',
        2: draft.narrators[1]?.narratorName ?? '',
        3: draft.narrators[2]?.narratorName ?? '',
      },
      categoryQuery: '',
      tagQuery: '',
    },
    errors: {},
    savedAt: null,
    message: '',
  };
}

export function filterEditorOptions(options, query) {
  const normalizedQuery = normalizeString(query);
  if (!normalizedQuery) {
    return options;
  }

  return options.filter((option) =>
    normalizeString(option.name).includes(normalizedQuery) || normalizeString(option.id).includes(normalizedQuery),
  );
}

export function getEditorAuthorName(authorId) {
  return optionNameById(TAXONOMY_AUTHOR_OPTIONS, authorId);
}

export function getEditorNarratorName(narratorId) {
  return optionNameById(TAXONOMY_NARRATOR_OPTIONS, narratorId);
}

export function updateAudiobookEditorField(state, field, value) {
  const nextDraft = { ...state.draft };
  const nextUi = { ...state.ui };

  if (field in nextDraft) {
    nextDraft[field] = field === 'durationSec' ? Number(value ?? 0) : value;
  }

  return {
    ...state,
    draft: nextDraft,
    ui: nextUi,
    errors: {},
    message: '',
  };
}

export function updateAudiobookEditorAuthor(state, authorId) {
  const authorName = getEditorAuthorName(authorId);
  return {
    ...state,
    draft: {
      ...state.draft,
      authorId,
      authorName,
    },
    ui: {
      ...state.ui,
      authorQuery: authorName,
    },
    errors: {},
    message: '',
  };
}

export function updateAudiobookEditorNarratorSlot(state, roleIndex, narratorId) {
  const narratorName = getEditorNarratorName(narratorId);
  const narrators = state.draft.narrators.map((slot) =>
    slot.roleIndex === roleIndex
      ? {
          roleIndex,
          narratorId,
          narratorName,
        }
      : slot,
  );

  return {
    ...state,
    draft: {
      ...state.draft,
      narrators,
    },
    ui: {
      ...state.ui,
      narratorQueries: {
        ...state.ui.narratorQueries,
        [roleIndex]: narratorName,
      },
    },
    errors: {},
    message: '',
  };
}

export function toggleAudiobookEditorCategory(state, categoryId) {
  const categoryIds = new Set(state.draft.categoryIds);
  if (categoryIds.has(categoryId)) {
    categoryIds.delete(categoryId);
  } else {
    categoryIds.add(categoryId);
  }

  return {
    ...state,
    draft: {
      ...state.draft,
      categoryIds: Array.from(categoryIds),
    },
    errors: {},
    message: '',
  };
}

export function toggleAudiobookEditorTag(state, tagId) {
  const tagIds = new Set(state.draft.tagIds);
  if (tagIds.has(tagId)) {
    tagIds.delete(tagId);
  } else {
    tagIds.add(tagId);
  }

  return {
    ...state,
    draft: {
      ...state.draft,
      tagIds: Array.from(tagIds),
    },
    errors: {},
    message: '',
  };
}

export function updateAudiobookEditorCover(state, { fileName, previewUrl }) {
  const normalizedFileName = String(fileName ?? '').trim();
  const coverImageAssetKey = normalizedFileName
    ? `covers/${slugifyFileName(normalizedFileName.replace(/\.[^.]+$/, '')) || 'uploaded-cover'}`
    : state.draft.coverImageAssetKey;

  return {
    ...state,
    draft: {
      ...state.draft,
      coverFileName: normalizedFileName,
      coverPreviewUrl: previewUrl || state.draft.coverPreviewUrl,
      coverImageAssetKey,
    },
    errors: {},
    message: '',
  };
}

export function validateAudiobookEditorState(state) {
  const errors = {};
  const title = normalizeString(state.draft.title);
  const authorId = normalizeString(state.draft.authorId);
  const durationSec = Number(state.draft.durationSec);
  const narratorCount = state.draft.narrators.filter((slot) => normalizeString(slot.narratorId)).length;

  if (!title) {
    errors.title = 'Title là bắt buộc.';
  }

  if (!authorId) {
    errors.authorId = 'Author là bắt buộc.';
  }

  if (!Number.isFinite(durationSec) || durationSec < 0) {
    errors.durationSec = 'Duration phải là số hợp lệ.';
  }

  if (narratorCount > MAX_EDITOR_NARRATORS) {
    errors.narrators = `Tối đa ${MAX_EDITOR_NARRATORS} narrator.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    publishLocked: state.draft.chapterCount <= 0,
  };
}

export function serializeAudiobookEditorPayload(state) {
  const durationSec = Number(state.draft.durationSec);
  return {
    title: String(state.draft.title).trim(),
    description: String(state.draft.description).trim() || null,
    coverImageAssetKey: state.draft.coverImageAssetKey || null,
    authorId: String(state.draft.authorId).trim(),
    durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0,
    premiumFlag: Boolean(state.draft.premiumFlag),
    languageCode: String(state.draft.languageCode || DEFAULT_EDITOR_LANGUAGE_CODE).trim() || DEFAULT_EDITOR_LANGUAGE_CODE,
  };
}

export function upsertAudiobookRecord(collection, record) {
  const nextCollection = new Map(collection);
  nextCollection.set(record.id, record);
  return nextCollection;
}

export function createLocalAudiobookId(existingIds = []) {
  const usedIds = new Set(existingIds);
  let index = 1;

  while (usedIds.has(`ab-local-${String(index).padStart(3, '0')}`)) {
    index += 1;
  }

  return `ab-local-${String(index).padStart(3, '0')}`;
}

export function isPublishedAudiobook(record) {
  return String(record?.status ?? '').toUpperCase() === 'PUBLISHED';
}

export function getEditorPublishWarning(record) {
  if (isPublishedAudiobook(record)) {
    return 'Nội dung này đã publish. Sửa metadata có thể ảnh hưởng search và reindex.';
  }

  return '';
}

export function listDemoAudiobookRecords() {
  return DEMO_AUDIOBOOKS.map((item) => ({
    ...item,
  }));
}
