import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type {
  ContentAuditAction,
  ContentAuditEntryRow,
  ContentAuditEntityType,
  ContentAuditLogger,
  ContentAuditRecordInput,
  ContentAuditTrailItem,
} from './content.audit.types.js';

export interface ContentAuditRepository {
  record(input: ContentAuditRecordInput): Promise<ContentAuditEntryRow>;
  listByEntity(entityType: ContentAuditEntityType, entityId: string): Promise<ContentAuditEntryRow[]>;
}

export interface ContentAuditRepositoryBundle {
  contentAuditRepository: ContentAuditRepository;
}

export function createContentAuditRepositoryBundle(database: DatabaseConnection): ContentAuditRepositoryBundle {
  return {
    contentAuditRepository: new PostgresContentAuditRepository(database),
  };
}

export class PostgresContentAuditRepository implements ContentAuditRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async record(input: ContentAuditRecordInput): Promise<ContentAuditEntryRow> {
    const result = await this.database.query<ContentAuditEntryRow>(
      `INSERT INTO content_audit_logs (
        entity_type,
        entity_id,
        entity_title,
        action,
        actor_user_id,
        actor_role,
        trace_id,
        payload_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING
        id,
        entity_type AS "entityType",
        entity_id AS "entityId",
        entity_title AS "entityTitle",
        action,
        actor_user_id AS "actorUserId",
        actor_role AS "actorRole",
        trace_id AS "traceId",
        payload_json AS "payloadJson",
        created_at AS "createdAt"`,
      [
        input.entityType,
        input.entityId,
        input.entityTitle ?? null,
        input.action,
        input.actorUserId ?? null,
        input.actorRole ?? null,
        input.traceId ?? null,
        JSON.stringify(input.payloadJson ?? {}),
      ],
    );

    return result.rows[0] as ContentAuditEntryRow;
  }

  async listByEntity(entityType: ContentAuditEntityType, entityId: string): Promise<ContentAuditEntryRow[]> {
    const result = await this.database.query<ContentAuditEntryRow>(
      `SELECT
        id,
        entity_type AS "entityType",
        entity_id AS "entityId",
        entity_title AS "entityTitle",
        action,
        actor_user_id AS "actorUserId",
        actor_role AS "actorRole",
        trace_id AS "traceId",
        payload_json AS "payloadJson",
        created_at AS "createdAt"
       FROM content_audit_logs
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC, id DESC`,
      [entityType, entityId],
    );

    return result.rows;
  }
}

export class ContentAuditService implements ContentAuditLogger {
  constructor(private readonly repository: ContentAuditRepository) {}

  async record(input: ContentAuditRecordInput): Promise<ContentAuditTrailItem> {
    const row = await this.repository.record(input);
    return this.toTrailItem(row);
  }

  async listByEntity(entityType: ContentAuditEntityType, entityId: string): Promise<ContentAuditTrailItem[]> {
    const rows = await this.repository.listByEntity(entityType, entityId);
    return rows.map((row) => this.toTrailItem(row));
  }

  private toTrailItem(row: ContentAuditEntryRow): ContentAuditTrailItem {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      entityTitle: row.entityTitle,
      action: row.action,
      actorUserId: row.actorUserId,
      actorRole: row.actorRole,
      traceId: row.traceId,
      payloadJson: row.payloadJson,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
