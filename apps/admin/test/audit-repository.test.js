import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuditTrailRepository } from '../src/features/audit/audit-repository.js';

test('audit repository records and filters local trail entries', async () => {
  const repository = createAuditTrailRepository({ adminApi: {} });
  const saved = await repository.recordAuditTrail({
    entityType: 'chapter',
    entityId: 'ch-new',
    entityTitle: 'New chapter',
    action: 'publish',
    actorUserId: 'admin-1',
    actorRole: 'ADMIN',
    payloadJson: { audiobookId: 'ab-001' },
  });

  assert.equal(saved.entityType, 'chapter');

  const filtered = await repository.listAuditTrails({
    entityType: 'chapter',
    entityId: 'ch-new',
  });

  assert.equal(filtered[0].entityId, 'ch-new');
});
