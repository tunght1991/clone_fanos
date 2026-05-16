import { DEMO_AUDIOBOOKS } from '../content-dashboard/content-dashboard-data.js';
import { listDemoChapters } from '../content-chapters/content-chapters-data.js';

const AUDIT_ENTITY_TYPES = ['audiobook', 'chapter'];
const AUDIT_ACTIONS = ['publish', 'unpublish'];

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeEntityType(value) {
  return AUDIT_ENTITY_TYPES.includes(String(value ?? '').toLowerCase())
    ? String(value ?? '').toLowerCase()
    : 'audiobook';
}

function normalizeAction(value) {
  return AUDIT_ACTIONS.includes(String(value ?? '').toLowerCase())
    ? String(value ?? '').toLowerCase()
    : 'publish';
}

function formatEntityTitle(record) {
  return String(record?.title ?? record?.name ?? '');
}

function createAuditId(prefix, entityId, createdAt) {
  return `${prefix}-${entityId}-${String(createdAt).replace(/[^0-9a-z]+/gi, '-')}`;
}

function normalizeAuditRecord(record) {
  const createdAt = record?.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString();
  return {
    id: String(record?.id ?? createAuditId('audit', record?.entityId ?? 'unknown', createdAt)),
    entityType: normalizeEntityType(record?.entityType),
    entityId: String(record?.entityId ?? ''),
    entityTitle: String(record?.entityTitle ?? ''),
    action: normalizeAction(record?.action),
    actorUserId: record?.actorUserId ?? null,
    actorRole: record?.actorRole ?? null,
    traceId: record?.traceId ?? null,
    payloadJson: record?.payloadJson ?? {},
    createdAt,
  };
}

function buildDemoAuditSeeds() {
  const audiobookEntries = DEMO_AUDIOBOOKS.filter((item) => item.publishedAt).map((item) => ({
    id: `audit-audiobook-${item.id}`,
    entityType: 'audiobook',
    entityId: item.id,
    entityTitle: formatEntityTitle(item),
    action: 'publish',
    actorUserId: 'admin-demo',
    actorRole: 'ADMIN',
    traceId: null,
    payloadJson: {
      status: item.status.toLowerCase(),
      reindexStatus: 'done',
    },
    createdAt: item.publishedAt,
  }));

  const chapterEntries = DEMO_AUDIOBOOKS.flatMap((book) =>
    listDemoChapters(book.id)
      .filter((chapter) => chapter.status === 'published' || chapter.publishedAt)
      .map((chapter) => ({
        id: `audit-chapter-${chapter.id}`,
        entityType: 'chapter',
        entityId: chapter.id,
        entityTitle: chapter.title,
        action: 'publish',
        actorUserId: 'admin-demo',
        actorRole: 'ADMIN',
        traceId: null,
        payloadJson: {
          audiobookId: book.id,
          reindexStatus: 'done',
        },
        createdAt: chapter.publishedAt ?? itemPublishedAt(book),
      })),
  );

  return [...audiobookEntries, ...chapterEntries]
    .map(normalizeAuditRecord)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function itemPublishedAt(book) {
  return book.publishedAt ?? book.updatedAt ?? new Date().toISOString();
}

export function listDemoAuditTrailEntries() {
  return buildDemoAuditSeeds();
}

export function createBlankAuditFilter() {
  return {
    entityType: 'audiobook',
    entityId: '',
    query: '',
  };
}

export function normalizeAuditTrailFilters(filters = {}) {
  return {
    entityType: normalizeEntityType(filters.entityType ?? 'audiobook'),
    entityId: normalizeString(filters.entityId),
    query: normalizeString(filters.query),
  };
}

export function normalizeAuditTrailRecord(record) {
  return normalizeAuditRecord(record);
}

export function filterAuditTrailRecords(records, filters = {}) {
  const normalizedFilters = normalizeAuditTrailFilters(filters);
  return [...records]
    .map(normalizeAuditRecord)
    .filter((record) => !normalizedFilters.entityType || record.entityType === normalizedFilters.entityType)
    .filter((record) => !normalizedFilters.entityId || record.entityId === normalizedFilters.entityId)
    .filter((record) => {
      if (!normalizedFilters.query) {
        return true;
      }

      return [
        record.entityTitle,
        record.entityId,
        record.actorRole,
        record.actorUserId,
        record.action,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedFilters.query.toLowerCase());
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function summarizeAuditTrail(records) {
  const total = records.length;
  const published = records.filter((record) => record.action === 'publish').length;
  const unpublished = records.filter((record) => record.action === 'unpublish').length;
  const latest = records[0] ?? null;

  return {
    total,
    published,
    unpublished,
    latest,
  };
}

export function createAuditTrailEntry(input) {
  const normalized = normalizeAuditRecord(input);
  return {
    ...normalized,
    payloadJson: {
      ...normalized.payloadJson,
      source: normalized.payloadJson?.source ?? 'admin-ui',
    },
  };
}

export function getAuditActionLabel(action) {
  return action === 'unpublish' ? 'Unpublish' : 'Publish';
}

export function getAuditEntityLabel(entityType) {
  return normalizeEntityType(entityType) === 'chapter' ? 'Chapter' : 'Audiobook';
}

