export type ContentAuditEntityType = 'audiobook' | 'chapter';
export type ContentAuditAction = 'publish' | 'unpublish';

export interface ContentAuditEntryRow {
  id: string;
  entityType: ContentAuditEntityType;
  entityId: string;
  entityTitle: string | null;
  action: ContentAuditAction;
  actorUserId: string | null;
  actorRole: string | null;
  traceId: string | null;
  payloadJson: Record<string, unknown>;
  createdAt: Date;
}

export interface ContentAuditTrailItem {
  id: string;
  entityType: ContentAuditEntityType;
  entityId: string;
  entityTitle: string | null;
  action: ContentAuditAction;
  actorUserId: string | null;
  actorRole: string | null;
  traceId: string | null;
  payloadJson: Record<string, unknown>;
  createdAt: string;
}

export interface ContentAuditRecordInput {
  entityType: ContentAuditEntityType;
  entityId: string;
  entityTitle?: string | null;
  action: ContentAuditAction;
  actorUserId?: string | null;
  actorRole?: string | null;
  traceId?: string | null;
  payloadJson?: Record<string, unknown>;
}

export interface ContentAuditLogger {
  record(input: ContentAuditRecordInput): Promise<ContentAuditTrailItem>;
  listByEntity(entityType: ContentAuditEntityType, entityId: string): Promise<ContentAuditTrailItem[]>;
}
