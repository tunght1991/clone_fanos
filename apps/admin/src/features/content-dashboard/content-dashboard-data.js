export const CONTENT_DASHBOARD_PAGE_SIZE = 6;

export const CONTENT_STATUS_OPTIONS = ['ALL', 'DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'];

export const DEMO_AUDIOBOOKS = [
  {
    id: 'ab-001',
    title: 'Tư duy hệ thống cho người bận rộn',
    description: 'Bản nghe giúp người bận rộn áp dụng tư duy hệ thống vào công việc hằng ngày.',
    coverImageAssetKey: 'covers/system-thinking.jpg',
    authorId: 'author-001',
    authorName: 'Nguyễn Hoàng',
    languageCode: 'vi',
    durationSec: 3840,
    narratorNames: ['Lan Anh'],
    narrators: [
      { id: 'narrator-001', name: 'Lan Anh', roleIndex: 1, isPrimary: true },
    ],
    categoryIds: ['category-business', 'category-self-development'],
    categoryNames: ['Business', 'Self-development'],
    tagIds: ['tag-retention', 'tag-habit'],
    tagNames: ['retention', 'habit'],
    premiumFlag: true,
    status: 'PUBLISHED',
    chapterCount: 12,
    updatedAt: '2026-05-11T08:12:00Z',
    publishedAt: '2026-05-10T10:00:00Z',
  },
  {
    id: 'ab-002',
    title: 'How to Learn Japanese Fast',
    description: 'Khóa nghe nền tảng cho người mới học tiếng Nhật theo nhịp đều mỗi ngày.',
    coverImageAssetKey: 'covers/japanese-fast.jpg',
    authorId: 'author-002',
    authorName: 'Mai Linh',
    languageCode: 'en',
    durationSec: 2580,
    narratorNames: ['Akira', 'Minh Thu'],
    narrators: [
      { id: 'narrator-002', name: 'Akira', roleIndex: 1, isPrimary: true },
      { id: 'narrator-003', name: 'Minh Thu', roleIndex: 2, isPrimary: false },
    ],
    categoryIds: ['category-japanese'],
    categoryNames: ['Japanese'],
    tagIds: ['tag-language', 'tag-daily-practice'],
    tagNames: ['language', 'daily-practice'],
    premiumFlag: false,
    status: 'DRAFT',
    chapterCount: 8,
    updatedAt: '2026-05-11T07:02:00Z',
    publishedAt: null,
  },
  {
    id: 'ab-003',
    title: 'AI cho nhân viên văn phòng',
    description: 'Những use case AI thực tế để tăng hiệu suất làm việc trong môi trường văn phòng.',
    coverImageAssetKey: 'covers/ai-office.jpg',
    authorId: 'author-003',
    authorName: 'Trần Nhật',
    languageCode: 'vi',
    durationSec: 3120,
    narratorNames: ['Huy'],
    narrators: [
      { id: 'narrator-004', name: 'Huy', roleIndex: 1, isPrimary: true },
    ],
    categoryIds: ['category-technology', 'category-business'],
    categoryNames: ['Technology', 'Business'],
    tagIds: ['tag-ai', 'tag-productivity'],
    tagNames: ['ai', 'productivity'],
    premiumFlag: true,
    status: 'PUBLISHED',
    chapterCount: 10,
    updatedAt: '2026-05-09T15:40:00Z',
    publishedAt: '2026-05-08T13:30:00Z',
  },
  {
    id: 'ab-004',
    title: 'Nghe để học tiếng Anh mỗi ngày',
    description: 'Chuỗi bài nghe ngắn để xây thói quen tiếng Anh mỗi ngày.',
    coverImageAssetKey: 'covers/english-daily.jpg',
    authorId: 'author-004',
    authorName: 'Lê Vy',
    languageCode: 'vi',
    durationSec: 2760,
    narratorNames: ['Khánh', 'Linh'],
    narrators: [
      { id: 'narrator-005', name: 'Khánh', roleIndex: 1, isPrimary: true },
      { id: 'narrator-006', name: 'Linh', roleIndex: 2, isPrimary: false },
    ],
    categoryIds: ['category-language'],
    categoryNames: ['Language'],
    tagIds: ['tag-english', 'tag-routine'],
    tagNames: ['english', 'routine'],
    premiumFlag: false,
    status: 'UNPUBLISHED',
    chapterCount: 7,
    updatedAt: '2026-05-10T19:15:00Z',
    publishedAt: '2026-05-01T09:00:00Z',
  },
  {
    id: 'ab-005',
    title: 'Kỷ luật bản thân và thói quen',
    description: 'Nội dung thực hành để xây dựng kỷ luật cá nhân và nhịp học tập bền vững.',
    coverImageAssetKey: 'covers/habit-discipline.jpg',
    authorId: 'author-005',
    authorName: 'Phạm Quang',
    languageCode: 'vi',
    durationSec: 4200,
    narratorNames: ['Thu Hà'],
    narrators: [
      { id: 'narrator-007', name: 'Thu Hà', roleIndex: 1, isPrimary: true },
    ],
    categoryIds: ['category-self-development'],
    categoryNames: ['Self-development'],
    tagIds: ['tag-habit', 'tag-discipline'],
    tagNames: ['habit', 'discipline'],
    premiumFlag: true,
    status: 'PUBLISHED',
    chapterCount: 14,
    updatedAt: '2026-05-12T01:22:00Z',
    publishedAt: '2026-05-11T18:00:00Z',
  },
  {
    id: 'ab-006',
    title: 'Quản lý tập trung cho team nhỏ',
    description: 'Bản tóm lược các nguyên tắc điều hành nhóm nhỏ với nhịp làm việc rõ ràng.',
    coverImageAssetKey: 'covers/small-team-management.jpg',
    authorId: 'author-006',
    authorName: 'Hoàng An',
    languageCode: 'vi',
    durationSec: 3010,
    narratorNames: ['Hải'],
    narrators: [
      { id: 'narrator-008', name: 'Hải', roleIndex: 1, isPrimary: true },
    ],
    categoryIds: ['category-management'],
    categoryNames: ['Management'],
    tagIds: ['tag-team', 'tag-leadership'],
    tagNames: ['team', 'leadership'],
    premiumFlag: false,
    status: 'ARCHIVED',
    chapterCount: 9,
    updatedAt: '2026-05-07T11:00:00Z',
    publishedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'ab-007',
    title: 'Content marketing thực chiến',
    description: 'Các khung thực chiến để vận hành content marketing theo mục tiêu tăng trưởng.',
    coverImageAssetKey: 'covers/content-marketing.jpg',
    authorId: 'author-007',
    authorName: 'Bảo Trân',
    languageCode: 'vi',
    durationSec: 3360,
    narratorNames: ['Minh'],
    narrators: [
      { id: 'narrator-009', name: 'Minh', roleIndex: 1, isPrimary: true },
    ],
    categoryIds: ['category-marketing'],
    categoryNames: ['Marketing'],
    tagIds: ['tag-growth', 'tag-content'],
    tagNames: ['growth', 'content'],
    premiumFlag: true,
    status: 'PUBLISHED',
    chapterCount: 11,
    updatedAt: '2026-05-10T06:30:00Z',
    publishedAt: '2026-05-09T09:00:00Z',
  },
];

export function normalizeContentDashboardItem(item) {
  return {
    id: String(item?.id ?? ''),
    title: String(item?.title ?? ''),
    authorName: String(item?.authorName ?? ''),
    narratorNames: Array.isArray(item?.narratorNames) ? item.narratorNames : [],
    categoryNames: Array.isArray(item?.categoryNames) ? item.categoryNames : [],
    tagNames: Array.isArray(item?.tagNames) ? item.tagNames : [],
    premiumFlag: Boolean(item?.premiumFlag),
    status: String(item?.status ?? 'DRAFT').toUpperCase(),
    chapterCount: Number(item?.chapterCount ?? 0),
    updatedAt: item?.updatedAt ?? null,
    publishedAt: item?.publishedAt ?? null,
  };
}

function normalizeString(value) {
  return String(value ?? '').trim().toLowerCase();
}

function hasSearchMatch(item, query) {
  const normalizedQuery = normalizeString(query);
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    item.title,
    item.authorName,
    ...(item.narratorNames ?? []),
    ...(item.categoryNames ?? []),
    ...(item.tagNames ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function normalizeContentDashboardFilters(search = {}) {
  const query = String(search.query ?? '').trim();
  const status = CONTENT_STATUS_OPTIONS.includes(String(search.status ?? 'ALL').toUpperCase())
    ? String(search.status ?? 'ALL').toUpperCase()
    : 'ALL';
  const parsedPage = Number.parseInt(String(search.page ?? '1'), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return {
    query,
    status,
    page,
    pageSize: CONTENT_DASHBOARD_PAGE_SIZE,
  };
}

export function filterContentAudiobooks(items, filters) {
  const normalizedFilters = normalizeContentDashboardFilters(filters);
  return items
    .filter((item) => normalizedFilters.status === 'ALL' || item.status === normalizedFilters.status)
    .filter((item) => hasSearchMatch(item, normalizedFilters.query))
    .slice()
    .sort((left, right) => {
      const leftDate = new Date(left.updatedAt).getTime();
      const rightDate = new Date(right.updatedAt).getTime();
      return rightDate - leftDate;
    });
}

export function paginateContentAudiobooks(items, filters) {
  const normalizedFilters = normalizeContentDashboardFilters(filters);
  const filteredItems = filterContentAudiobooks(items, normalizedFilters);
  const totalItems = filteredItems.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / normalizedFilters.pageSize);
  const page = Math.min(normalizedFilters.page, totalPages);
  const startIndex = (page - 1) * normalizedFilters.pageSize;
  const pageItems = filteredItems.slice(startIndex, startIndex + normalizedFilters.pageSize);

  return {
    items: pageItems,
    meta: {
      query: normalizedFilters.query,
      status: normalizedFilters.status,
      page,
      pageSize: normalizedFilters.pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

export function makeContentDashboardSearch(filters) {
  const normalizedFilters = normalizeContentDashboardFilters(filters);
  return {
    query: normalizedFilters.query,
    status: normalizedFilters.status,
    page: String(normalizedFilters.page),
  };
}

export function resolveContentAudiobookById(items, audiobookId) {
  return items.find((item) => item.id === audiobookId) ?? null;
}
