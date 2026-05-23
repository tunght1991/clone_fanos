import { hashPassword } from './password-hash.js';
import type { DatabaseExecutor } from '../../db/postgres.js';

export interface DevelopmentAdminSeedConfig {
  email?: string;
  password?: string;
  displayName?: string;
}

export async function ensureDevelopmentAdminUser(
  database: DatabaseExecutor,
  config: DevelopmentAdminSeedConfig = {},
): Promise<void> {
  const email = normalizeSeedEmail(config.email ?? 'admin@fonos.test');
  const password = config.password ?? 'Secret123!';
  const displayName = normalizeSeedDisplayName(config.displayName ?? 'Admin One');
  const passwordHash = hashPassword(password);

  const existing = await database.query<{ id: string }>(
    `SELECT id
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );

  if (existing.rows[0]) {
    await database.query(
      `UPDATE users
       SET password_hash = $2,
           display_name = $3,
           role = 'admin',
           is_active = true,
           updated_at = now()
       WHERE lower(email) = lower($1)`,
      [email, passwordHash, displayName],
    );
    return;
  }

  await database.query(
    `INSERT INTO users (
      email,
      password_hash,
      display_name,
      avatar_asset_key,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, NULL, 'admin', true, now(), now())`,
    [email, passwordHash, displayName],
  );
}

function normalizeSeedEmail(email: string): string {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Invalid seed admin email');
  }

  return normalized;
}

function normalizeSeedDisplayName(displayName: string): string {
  const normalized = String(displayName ?? '').trim();
  if (!normalized) {
    throw new Error('Invalid seed admin display name');
  }

  return normalized;
}
