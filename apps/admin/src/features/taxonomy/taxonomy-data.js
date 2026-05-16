const TAXONOMY_TYPES = ['author', 'category', 'tag', 'narrator'];

const DEMO_TAXONOMY_SEEDS = {
  author: [
    { id: 'author-001', name: 'Nguyễn Hoàng', description: 'Business, systems thinking', usageCount: 3, isActive: true },
    { id: 'author-002', name: 'Mai Linh', description: 'Japanese learning and habit building', usageCount: 2, isActive: true },
    { id: 'author-003', name: 'Trần Nhật', description: 'AI and productivity', usageCount: 4, isActive: true },
    { id: 'author-004', name: 'Lê Vy', description: 'Language learning', usageCount: 1, isActive: true },
    { id: 'author-005', name: 'Phạm Quang', description: 'Self-development', usageCount: 2, isActive: true },
    { id: 'author-006', name: 'Hoàng An', description: 'Management', usageCount: 1, isActive: true },
    { id: 'author-007', name: 'Bảo Trân', description: 'Marketing', usageCount: 1, isActive: true },
  ],
  category: [
    { id: 'category-business', name: 'Business', description: 'Business content', usageCount: 2, isActive: true },
    { id: 'category-self-development', name: 'Self-development', description: 'Self growth and habits', usageCount: 3, isActive: true },
    { id: 'category-japanese', name: 'Japanese', description: 'Japanese learning', usageCount: 1, isActive: true },
    { id: 'category-technology', name: 'Technology', description: 'Tech and AI', usageCount: 2, isActive: true },
    { id: 'category-language', name: 'Language', description: 'Language learning', usageCount: 2, isActive: true },
    { id: 'category-management', name: 'Management', description: 'Team and management', usageCount: 1, isActive: true },
    { id: 'category-marketing', name: 'Marketing', description: 'Growth and content marketing', usageCount: 1, isActive: true },
  ],
  tag: [
    { id: 'tag-retention', name: 'retention', description: 'Retention-oriented content', usageCount: 2, isActive: true },
    { id: 'tag-habit', name: 'habit', description: 'Daily habit content', usageCount: 3, isActive: true },
    { id: 'tag-language', name: 'language', description: 'Language learning content', usageCount: 2, isActive: true },
    { id: 'tag-daily-practice', name: 'daily-practice', description: 'Daily practice content', usageCount: 1, isActive: true },
    { id: 'tag-ai', name: 'ai', description: 'AI-related content', usageCount: 1, isActive: true },
    { id: 'tag-productivity', name: 'productivity', description: 'Productivity content', usageCount: 1, isActive: true },
    { id: 'tag-english', name: 'english', description: 'English learning content', usageCount: 1, isActive: true },
    { id: 'tag-routine', name: 'routine', description: 'Routine building content', usageCount: 1, isActive: true },
    { id: 'tag-discipline', name: 'discipline', description: 'Discipline and habit', usageCount: 1, isActive: true },
    { id: 'tag-team', name: 'team', description: 'Team management', usageCount: 1, isActive: true },
    { id: 'tag-leadership', name: 'leadership', description: 'Leadership content', usageCount: 1, isActive: true },
    { id: 'tag-growth', name: 'growth', description: 'Growth-oriented content', usageCount: 1, isActive: true },
    { id: 'tag-content', name: 'content', description: 'Content marketing content', usageCount: 1, isActive: true },
  ],
  narrator: [
    { id: 'narrator-001', name: 'Lan Anh', description: 'Primary narrator', usageCount: 2, isActive: true },
    { id: 'narrator-002', name: 'Akira', description: 'Japanese voice', usageCount: 1, isActive: true },
    { id: 'narrator-003', name: 'Minh Thu', description: 'Supporting voice', usageCount: 1, isActive: true },
    { id: 'narrator-004', name: 'Huy', description: 'Productivity voice', usageCount: 2, isActive: true },
    { id: 'narrator-005', name: 'Khánh', description: 'English learning voice', usageCount: 1, isActive: true },
    { id: 'narrator-006', name: 'Linh', description: 'English learning voice', usageCount: 1, isActive: true },
    { id: 'narrator-007', name: 'Thu Hà', description: 'Habit voice', usageCount: 1, isActive: true },
    { id: 'narrator-008', name: 'Hải', description: 'Management voice', usageCount: 1, isActive: true },
    { id: 'narrator-009', name: 'Minh', description: 'Marketing voice', usageCount: 1, isActive: true },
  ],
};

function normalizeString(value) {
  return String(value ?? '').trim();
}

function slugify(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeType(type) {
  return TAXONOMY_TYPES.includes(String(type ?? '').toLowerCase())
    ? String(type ?? '').toLowerCase()
    : 'author';
}

function sortByName(records) {
  return [...records].sort((left, right) => left.name.localeCompare(right.name));
}

export function getTaxonomyTypeLabel(type) {
  return {
    author: 'Author',
    category: 'Category',
    tag: 'Tag',
    narrator: 'Narrator',
  }[normalizeType(type)] ?? 'Author';
}

export function getTaxonomyTypePluralLabel(type) {
  return {
    author: 'Authors',
    category: 'Categories',
    tag: 'Tags',
    narrator: 'Narrators',
  }[normalizeType(type)] ?? 'Authors';
}

export function normalizeTaxonomyRecord(type, record) {
  const normalizedType = normalizeType(type);
  const name = normalizeString(record?.name);
  const id = String(record?.id ?? (slugify(name) || `${normalizedType}-local`));
  const slug = String(record?.slug ?? slugify(name || id));

  return {
    id,
    type: normalizedType,
    name,
    slug,
    description: String(record?.description ?? ''),
    usageCount: Number(record?.usageCount ?? 0),
    isActive: record?.isActive !== false,
    createdAt: record?.createdAt ?? null,
    updatedAt: record?.updatedAt ?? null,
  };
}

export function listDemoTaxonomyRecords(type) {
  const normalizedType = normalizeType(type);
  return sortByName((DEMO_TAXONOMY_SEEDS[normalizedType] ?? []).map((record) => normalizeTaxonomyRecord(normalizedType, record)));
}

export function getTaxonomySourceOptions(type) {
  return listDemoTaxonomyRecords(type).map((record) => ({
    id: record.id,
    name: record.name,
  }));
}

export const DEMO_AUTHOR_OPTIONS = getTaxonomySourceOptions('author');
export const DEMO_CATEGORY_OPTIONS = getTaxonomySourceOptions('category');
export const DEMO_TAG_OPTIONS = getTaxonomySourceOptions('tag');
export const DEMO_NARRATOR_OPTIONS = getTaxonomySourceOptions('narrator');

export function createBlankTaxonomyDraft(type) {
  const normalizedType = normalizeType(type);
  return {
    id: '',
    type: normalizedType,
    name: '',
    slug: '',
    description: '',
    usageCount: 0,
    isActive: true,
    createdAt: null,
    updatedAt: null,
  };
}

export function buildTaxonomyDraftFromRecord(record, type) {
  return {
    ...createBlankTaxonomyDraft(type),
    ...normalizeTaxonomyRecord(type, record),
  };
}

export function updateTaxonomyDraftField(state, field, value) {
  const nextDraft = { ...state.draft };
  const nextUi = { ...state.ui };

  if (field in nextDraft) {
    nextDraft[field] = field === 'usageCount' ? Number(value ?? 0) : value;
  }

  if (field === 'name' && !nextDraft.slug) {
    nextDraft.slug = slugify(value);
  }

  return {
    ...state,
    draft: nextDraft,
    ui: nextUi,
    errors: {},
    message: '',
  };
}

export function updateTaxonomyDraftSlug(state, value) {
  return {
    ...state,
    draft: {
      ...state.draft,
      slug: slugify(value),
    },
    errors: {},
    message: '',
  };
}

export function toggleTaxonomyActive(state) {
  return {
    ...state,
    draft: {
      ...state.draft,
      isActive: !state.draft.isActive,
    },
    errors: {},
    message: '',
  };
}

export function filterTaxonomyRecords(records, query) {
  const normalizedQuery = normalizeString(query).toLowerCase();
  if (!normalizedQuery) {
    return sortByName(records.map((record) => normalizeTaxonomyRecord(record.type, record)));
  }

  return sortByName(
    records
      .map((record) => normalizeTaxonomyRecord(record.type, record))
      .filter((record) =>
        [
          record.name,
          record.slug,
          record.description,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      ),
  );
}

export function validateTaxonomyDraft(draft, records = []) {
  const errors = {};
  const name = normalizeString(draft.name);
  const slug = normalizeString(draft.slug) || slugify(name);

  if (!name) {
    errors.name = `${getTaxonomyTypeLabel(draft.type)} name is required.`;
  }

  if (!slug) {
    errors.slug = 'Slug is required.';
  }

  const duplicateName = records.some(
    (record) =>
      record.id !== draft.id &&
      normalizeString(record.name).toLowerCase() === name.toLowerCase(),
  );
  if (duplicateName) {
    errors.name = `${getTaxonomyTypeLabel(draft.type)} name already exists.`;
  }

  const duplicateSlug = records.some(
    (record) =>
      record.id !== draft.id &&
      normalizeString(record.slug).toLowerCase() === slug.toLowerCase(),
  );
  if (duplicateSlug) {
    errors.slug = 'Slug already exists.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function serializeTaxonomyPayload(draft) {
  return {
    name: normalizeString(draft.name),
    slug: normalizeString(draft.slug) || slugify(draft.name),
    description: normalizeString(draft.description) || null,
    isActive: Boolean(draft.isActive),
  };
}

export function upsertTaxonomyRecord(records, record) {
  const nextRecord = normalizeTaxonomyRecord(record.type, record);
  const filtered = records.filter((item) => item.id !== nextRecord.id);
  return sortByName([...filtered, nextRecord]);
}

export function deleteTaxonomyRecord(records, id) {
  return records.filter((item) => item.id !== id);
}

export function createTaxonomyManagerState(type = 'author', records = []) {
  const normalizedType = normalizeType(type);
  const normalizedRecords = sortByName(records.map((record) => normalizeTaxonomyRecord(normalizedType, record)));
  return {
    type: normalizedType,
    status: 'editing',
    records: normalizedRecords,
    filteredRecords: normalizedRecords,
    selectedId: normalizedRecords[0]?.id ?? '',
    draft: createBlankTaxonomyDraft(normalizedType),
    query: '',
    errors: {},
    message: '',
    ui: {
      queryByType: {
        author: '',
        category: '',
        tag: '',
        narrator: '',
      },
    },
  };
}

export function withTaxonomyQuery(state, query) {
  const nextQuery = normalizeString(query);
  return {
    ...state,
    query: nextQuery,
    filteredRecords: filterTaxonomyRecords(state.records, nextQuery),
  };
}

export function getTaxonomyPublishHint(type, draft) {
  if (!draft.isActive) {
    return `${getTaxonomyTypeLabel(type)} is inactive and may not appear in selectors.`;
  }

  return '';
}
