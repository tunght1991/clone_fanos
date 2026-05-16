import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

test('initial migration enforces narrator role index bounds for three voices', () => {
  const migrationPath = join(process.cwd(), '../../infra/migrations/0001_initial.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  assert.match(sql, /role_index smallint NOT NULL CHECK \(role_index BETWEEN 1 AND 3\)/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS audiobook_narrators_role_uidx/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS audiobook_narrators_primary_uidx/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS subscription_receipt_verifications/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS subscription_receipt_verifications_idempotency_uidx/);
});
