import assert from 'node:assert/strict';
import test from 'node:test';

import { ContentAuditService } from './content.audit.repository.js';

test('ContentAuditService records publish actions and exposes audit trail entries', async () => {
  const recorded: Array<{ entityType: string; entityId: string; action: string }> = [];

  const service = new ContentAuditService({
    async record(input) {
      recorded.push({
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
      });

      return {
        id: 'audit-1',
        entityType: input.entityType,
        entityId: input.entityId,
        entityTitle: input.entityTitle ?? null,
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        traceId: input.traceId ?? null,
        payloadJson: input.payloadJson ?? {},
        createdAt: new Date('2026-05-11T00:00:00.000Z'),
      };
    },
    async listByEntity(entityType, entityId) {
      return [
        {
          id: 'audit-1',
          entityType,
          entityId,
          entityTitle: 'Book',
          action: 'publish',
          actorUserId: 'admin-1',
          actorRole: 'admin',
          traceId: 'trace-1',
          payloadJson: { status: 'published' },
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
        },
      ];
    },
  });

  const entry = await service.record({
    entityType: 'audiobook',
    entityId: 'book-1',
    entityTitle: 'Book',
    action: 'publish',
    actorUserId: 'admin-1',
    actorRole: 'admin',
    traceId: 'trace-1',
    payloadJson: { status: 'published' },
  });

  const trail = await service.listByEntity('audiobook', 'book-1');

  assert.deepEqual(recorded, [{ entityType: 'audiobook', entityId: 'book-1', action: 'publish' }]);
  assert.equal(entry.action, 'publish');
  assert.equal(trail[0].entityTitle, 'Book');
  assert.equal(trail[0].createdAt, '2026-05-11T00:00:00.000Z');
});
