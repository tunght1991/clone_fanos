import { createAdminApi } from '../../api/admin-api.js';
import {
  createAuditTrailEntry,
  filterAuditTrailRecords,
  listDemoAuditTrailEntries,
  normalizeAuditTrailRecord,
} from './audit-data.js';

export function createAuditTrailRepository({
  adminApi = createAdminApi(),
  seedRecords = listDemoAuditTrailEntries(),
} = {}) {
  let records = seedRecords.map(normalizeAuditTrailRecord);

  async function listAuditTrails(filters = {}) {
    try {
      if (!adminApi.listAuditTrails) {
        throw new Error('Admin API listAuditTrails is unavailable.');
      }

      const response = await adminApi.listAuditTrails(filters);
      const apiItems = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      const normalized = apiItems.map(normalizeAuditTrailRecord);
      if (normalized.length > 0) {
        records = normalized;
      }
    } catch {
      // fallback to local store
    }

    return filterAuditTrailRecords(records, filters);
  }

  async function recordAuditTrail(input) {
    const entry = createAuditTrailEntry(input);

    try {
      if (adminApi.recordAuditTrail) {
        const response = await adminApi.recordAuditTrail(input);
        const normalized = normalizeAuditTrailRecord(response?.data ?? response);
        records = [normalized, ...records.filter((item) => item.id !== normalized.id)];
        return normalized;
      }
    } catch {
      // fallback below
    }

    records = [entry, ...records.filter((item) => item.id !== entry.id)];
    return entry;
  }

  function listByEntity(entityType, entityId) {
    return filterAuditTrailRecords(records, { entityType, entityId });
  }

  function listRecent(limit = 20) {
    return [...records]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, limit);
  }

  function snapshot() {
    return [...records];
  }

  return {
    listAuditTrails,
    recordAuditTrail,
    listByEntity,
    listRecent,
    snapshot,
  };
}
