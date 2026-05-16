import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAuditTrailEntry,
  filterAuditTrailRecords,
  listDemoAuditTrailEntries,
  normalizeAuditTrailFilters,
  summarizeAuditTrail,
} from '../src/features/audit/audit-data.js';

test('listDemoAuditTrailEntries seeds publish actions from demo content', () => {
  const entries = listDemoAuditTrailEntries();

  assert.ok(entries.length > 0);
  assert.ok(entries.some((entry) => entry.entityType === 'audiobook'));
});

test('normalizeAuditTrailFilters preserves entity filters safely', () => {
  const filters = normalizeAuditTrailFilters({
    entityType: 'chapter',
    entityId: 'ch-1',
    query: 'publish',
  });

  assert.deepEqual(filters, {
    entityType: 'chapter',
    entityId: 'ch-1',
    query: 'publish',
  });
});

test('filterAuditTrailRecords narrows results by entity and query', () => {
  const entries = listDemoAuditTrailEntries();
  const filtered = filterAuditTrailRecords(entries, {
    entityType: 'audiobook',
    query: 'publish',
  });

  assert.ok(filtered.every((entry) => entry.entityType === 'audiobook'));
});

test('summarizeAuditTrail returns totals and latest entry', () => {
  const entries = listDemoAuditTrailEntries();
  const summary = summarizeAuditTrail(entries);

  assert.equal(summary.total, entries.length);
  assert.ok(summary.latest);
});

test('createAuditTrailEntry normalizes payload data', () => {
  const entry = createAuditTrailEntry({
    entityType: 'audiobook',
    entityId: 'ab-001',
    entityTitle: 'Demo',
    action: 'publish',
    payloadJson: {},
  });

  assert.equal(entry.payloadJson.source, 'admin-ui');
});
