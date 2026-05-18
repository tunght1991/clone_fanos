import { DEMO_AUDIOBOOKS } from '../content-dashboard/content-dashboard-data.js';

export const CHAPTER_STATUS_OPTIONS = ['draft', 'ready', 'published', 'archived'];

const DEMO_CHAPTER_SEEDS = [
  {
    audiobookId: 'ab-001',
    chapters: [
      {
        id: 'ch-ab-001-001',
        title: 'Tại sao cần tư duy hệ thống',
        orderIndex: 1,
        durationSec: 780,
        audioAssetKey: 'audio/ab-001/ch-001.mp3',
        transcript: 'Giới thiệu khung tư duy hệ thống cho người bận rộn.',
        status: 'published',
      },
      {
        id: 'ch-ab-001-002',
        title: 'Nhận diện điểm nghẽn trong công việc',
        orderIndex: 2,
        durationSec: 920,
        audioAssetKey: 'audio/ab-001/ch-002.mp3',
        transcript: 'Cách tìm điểm nghẽn và ưu tiên xử lý.',
        status: 'draft',
      },
      {
        id: 'ch-ab-001-003',
        title: 'Thiết kế thói quen nhỏ',
        orderIndex: 3,
        durationSec: 840,
        audioAssetKey: 'audio/ab-001/ch-003.mp3',
        transcript: 'Tạo các thói quen nhỏ để duy trì nhịp học.',
        status: 'draft',
      },
    ],
  },
  {
    audiobookId: 'ab-002',
    chapters: [
      {
        id: 'ch-ab-002-001',
        title: 'Bắt đầu với phát âm nền tảng',
        orderIndex: 1,
        durationSec: 640,
        audioAssetKey: 'audio/ab-002/ch-001.mp3',
        transcript: 'Học cách nghe và bắt chước nhịp phát âm.',
        status: 'draft',
      },
      {
        id: 'ch-ab-002-002',
        title: 'Mẫu câu dùng mỗi ngày',
        orderIndex: 2,
        durationSec: 700,
        audioAssetKey: 'audio/ab-002/ch-002.mp3',
        transcript: 'Các mẫu câu cơ bản cho lịch học hàng ngày.',
        status: 'ready',
      },
    ],
  },
];

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeChapterStatus(value) {
  const status = String(value ?? 'draft').toLowerCase();
  return CHAPTER_STATUS_OPTIONS.includes(status) ? status : 'draft';
}

function sortChapters(chapters) {
  return [...chapters].sort((left, right) => left.orderIndex - right.orderIndex);
}

export function getDemoAudiobookSummary(audiobookId) {
  return DEMO_AUDIOBOOKS.find((item) => item.id === audiobookId) ?? null;
}

export function listDemoChapters(audiobookId) {
  const seed = DEMO_CHAPTER_SEEDS.find((item) => item.audiobookId === audiobookId);
  return sortChapters((seed?.chapters ?? []).map(normalizeChapterRecord));
}

export function normalizeChapterRecord(record) {
  return {
    id: String(record?.id ?? ''),
    audiobookId: String(record?.audiobookId ?? ''),
    title: String(record?.title ?? ''),
    orderIndex: Number(record?.orderIndex ?? 1),
    durationSec: Number(record?.durationSec ?? 0),
    audioAssetKey: String(record?.audioAssetKey ?? ''),
    audioPreviewUrl: String(record?.audioPreviewUrl ?? ''),
    audioFileName: String(record?.audioFileName ?? ''),
    transcript: String(record?.transcript ?? ''),
    status: normalizeChapterStatus(record?.status),
    publishedAt: record?.publishedAt ?? null,
    updatedAt: record?.updatedAt ?? null,
  };
}

export function createBlankChapterDraft(audiobookId, nextOrderIndex = 1) {
  return {
    id: '',
    audiobookId: String(audiobookId ?? ''),
    title: '',
    orderIndex: Number(nextOrderIndex ?? 1),
    durationSec: 0,
    audioAssetKey: '',
    audioPreviewUrl: '',
    audioFileName: '',
    transcript: '',
    status: 'draft',
    publishedAt: null,
    updatedAt: null,
  };
}

export function createChapterManagerState(audiobook, chapters = []) {
  const sortedChapters = sortChapters(chapters.map(normalizeChapterRecord));
  const nextOrderIndex = sortedChapters.length > 0
    ? Math.max(...sortedChapters.map((chapter) => chapter.orderIndex)) + 1
    : 1;
  return {
    audiobook: audiobook ? normalizeAudiobookSummary(audiobook) : null,
    chapters: sortedChapters,
    selectedChapterId: sortedChapters[0]?.id ?? '',
    draft: createBlankChapterDraft(audiobook?.id ?? '', nextOrderIndex),
    status: 'editing',
    errors: {},
    message: '',
    uploadStatus: 'idle',
    ui: {
      selectedOrderSearch: '',
    },
  };
}

function normalizeAudiobookSummary(audiobook) {
  const chapterCount = Number(audiobook?.chapterCount);
  return {
    id: String(audiobook?.id ?? ''),
    title: String(audiobook?.title ?? ''),
    authorName: String(audiobook?.authorName ?? audiobook?.author?.name ?? ''),
    premiumFlag: Boolean(audiobook?.premiumFlag),
    status: String(audiobook?.status ?? 'DRAFT').toUpperCase(),
    chapterCount: Number.isFinite(chapterCount)
      ? chapterCount
      : Array.isArray(audiobook?.chapters)
        ? audiobook.chapters.length
        : 0,
  };
}

export function buildChapterDraftFromRecord(record, audiobookId) {
  const normalized = normalizeChapterRecord(record);
  return {
    ...createBlankChapterDraft(audiobookId, normalized.orderIndex),
    ...normalized,
    transcript: normalized.transcript ?? '',
  };
}

export function validateChapterDraft(draft, chapters = []) {
  const errors = {};
  const title = normalizeString(draft.title);
  const audioAssetKey = normalizeString(draft.audioAssetKey);
  const orderIndex = Number(draft.orderIndex);
  const durationSec = Number(draft.durationSec);

  if (!title) {
    errors.title = 'Chapter title là bắt buộc.';
  }

  if (!Number.isInteger(orderIndex) || orderIndex <= 0) {
    errors.orderIndex = 'Order phải là số nguyên dương.';
  }

  const duplicatedOrder = chapters.some(
    (chapter) => chapter.id !== draft.id && Number(chapter.orderIndex) === orderIndex,
  );
  if (duplicatedOrder) {
    errors.orderIndex = 'Order đã bị trùng với chapter khác.';
  }

  if (!audioAssetKey) {
    errors.audioAssetKey = 'Audio asset key là bắt buộc.';
  }

  if (!Number.isFinite(durationSec) || durationSec < 0) {
    errors.durationSec = 'Duration phải là số hợp lệ.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    publishLocked: !audioAssetKey || !title,
  };
}

export function serializeChapterPayload(draft) {
  const durationSec = Number(draft.durationSec);
  return {
    title: String(draft.title).trim(),
    orderIndex: Number(draft.orderIndex),
    durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0,
    audioAssetKey: String(draft.audioAssetKey).trim(),
    transcript: String(draft.transcript ?? '').trim() || null,
  };
}

export function createLocalChapterId(existingIds = []) {
  const usedIds = new Set(existingIds);
  let index = 1;

  while (usedIds.has(`ch-local-${String(index).padStart(3, '0')}`)) {
    index += 1;
  }

  return `ch-local-${String(index).padStart(3, '0')}`;
}

export function sortChapterRecords(chapters) {
  return sortChapters(chapters.map(normalizeChapterRecord));
}

export function replaceChapterRecord(chapters, nextChapter) {
  const nextNormalized = normalizeChapterRecord(nextChapter);
  const filtered = chapters.filter((chapter) => chapter.id !== nextNormalized.id);
  return sortChapters([...filtered, nextNormalized]);
}

export function reorderChapterRecords(chapters, chapterId, direction) {
  const sorted = sortChapters(chapters.map(normalizeChapterRecord));
  const index = sorted.findIndex((chapter) => chapter.id === chapterId);
  if (index === -1) {
    return sorted;
  }

  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= sorted.length) {
    return sorted;
  }

  const next = [...sorted];
  const [moved] = next.splice(index, 1);
  next.splice(nextIndex, 0, moved);
  return next.map((chapter, idx) => ({
    ...chapter,
    orderIndex: idx + 1,
  }));
}

export function markChapterUploaded(draft, { fileName, previewUrl }) {
  const normalizedFileName = String(fileName ?? '').trim();
  const slug = normalizedFileName.replace(/\.[^.]+$/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'chapter-audio';
  return {
    ...draft,
    audioFileName: normalizedFileName,
    audioPreviewUrl: previewUrl || draft.audioPreviewUrl,
    audioAssetKey: `audio/${draft.audiobookId || 'audiobook'}/${slug}`,
  };
}

export function ensureUniqueOrderIndex(chapters, draft) {
  const existingOrders = new Set(chapters.filter((chapter) => chapter.id !== draft.id).map((chapter) => chapter.orderIndex));
  let nextOrder = Number(draft.orderIndex);

  while (existingOrders.has(nextOrder)) {
    nextOrder += 1;
  }

  return {
    ...draft,
    orderIndex: nextOrder,
  };
}

export function getChapterPublishWarning(draft) {
  const hasEditableContent = Boolean(
    String(draft?.id ?? '').trim()
    || String(draft?.title ?? '').trim()
    || String(draft?.audioFileName ?? '').trim()
    || String(draft?.audioPreviewUrl ?? '').trim(),
  );

  if (hasEditableContent && !draft.audioAssetKey) {
    return 'Chapter chưa có audio asset key nên chưa nên publish.';
  }

  return '';
}
