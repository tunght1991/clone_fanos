import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuditTrailEntry, listDemoAuditTrailEntries } from '../src/features/audit/audit-data.js';
import { renderAuditTrailView } from '../src/features/audit/audit-view.js';

test('renderAuditTrailView shows timeline and audit table', () => {
  const entries = [
    createAuditTrailEntry({
      entityType: 'audiobook',
      entityId: 'ab-001',
      entityTitle: 'Demo audiobook',
      action: 'publish',
      actorUserId: 'admin-1',
      actorRole: 'ADMIN',
      payloadJson: {},
      createdAt: '2026-05-11T00:00:00.000Z',
    }),
    ...listDemoAuditTrailEntries().slice(0, 1),
  ];

  const html = renderAuditTrailView({
    state: {
      filters: {
        entityType: 'audiobook',
        entityId: 'ab-001',
        query: '',
      },
      entries,
      message: '',
      errorMessage: '',
    },
    entityOptions: [{ id: 'ab-001', label: 'Demo audiobook' }],
  });

  assert.match(html, /Audit trail/i);
  assert.match(html, /Status timeline/i);
  assert.match(html, /Demo audiobook/i);
  assert.match(html, /Apply filters/i);
  assert.match(html, /Clear filters/i);
});

test('renderAuditTrailView shows loading and error states', () => {
  const loadingHtml = renderAuditTrailView({
    state: {
      status: 'loading',
      filters: {
        entityType: 'audiobook',
        entityId: 'ab-001',
        query: '',
      },
      entries: [],
      message: '',
      errorMessage: '',
    },
    entityOptions: [{ id: 'ab-001', label: 'Demo audiobook' }],
  });

  assert.match(loadingHtml, /Loading audit trail/i);

  const errorHtml = renderAuditTrailView({
    state: {
      status: 'error',
      filters: {
        entityType: 'audiobook',
        entityId: 'ab-001',
        query: '',
      },
      entries: [],
      message: '',
      errorMessage: 'Unable to load audit trail.',
    },
    entityOptions: [{ id: 'ab-001', label: 'Demo audiobook' }],
  });

  assert.match(errorHtml, /Unable to load audit trail/i);
});
