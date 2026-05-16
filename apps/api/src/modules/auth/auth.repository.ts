import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { AuthSessionRow, AuthUserRow, AuthUserRole } from './auth.types.js';

export interface AuthUserRepository {
  findById(id: string): Promise<AuthUserRow | null>;
  findByEmail(email: string): Promise<AuthUserRow | null>;
  createUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    avatarAssetKey?: string | null;
    role?: AuthUserRole;
    isActive?: boolean;
  }): Promise<AuthUserRow>;
}

export interface AuthSessionRepository {
  createSession(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRow>;
  findActiveByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSessionRow | null>;
  revokeByRefreshTokenHash(refreshTokenHash: string): Promise<boolean>;
}

export interface AuthRepositoryBundle {
  userRepository: AuthUserRepository;
  sessionRepository: AuthSessionRepository;
}

export function createAuthRepositoryBundle(database: DatabaseConnection): AuthRepositoryBundle {
  return {
    userRepository: new PostgresAuthUserRepository(database),
    sessionRepository: new PostgresAuthSessionRepository(database),
  };
}

export class PostgresAuthUserRepository implements AuthUserRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findById(id: string): Promise<AuthUserRow | null> {
    const result = await this.database.query<AuthUserRow>(
      `SELECT
        id,
        email,
        password_hash AS "passwordHash",
        display_name AS "displayName",
        avatar_asset_key AS "avatarAssetKey",
        role,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM users
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<AuthUserRow | null> {
    const result = await this.database.query<AuthUserRow>(
      `SELECT
        id,
        email,
        password_hash AS "passwordHash",
        display_name AS "displayName",
        avatar_asset_key AS "avatarAssetKey",
        role,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM users
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [email],
    );

    return result.rows[0] ?? null;
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    avatarAssetKey?: string | null;
    role?: AuthUserRole;
    isActive?: boolean;
  }): Promise<AuthUserRow> {
    const result = await this.database.query<AuthUserRow>(
      `INSERT INTO users (
        email,
        password_hash,
        display_name,
        avatar_asset_key,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, now(), now())
      RETURNING
        id,
        email,
        password_hash AS "passwordHash",
        display_name AS "displayName",
        avatar_asset_key AS "avatarAssetKey",
        role,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        input.email,
        input.passwordHash,
        input.displayName,
        input.avatarAssetKey ?? null,
        input.role ?? 'user',
        input.isActive ?? true,
      ],
    );

    return result.rows[0] as AuthUserRow;
  }
}

export class PostgresAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async createSession(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRow> {
    const result = await this.database.query<AuthSessionRow>(
      `INSERT INTO auth_sessions (
        user_id,
        refresh_token_hash,
        expires_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, now(), now())
      RETURNING
        id,
        user_id AS "userId",
        refresh_token_hash AS "refreshTokenHash",
        expires_at AS "expiresAt",
        revoked_at AS "revokedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [input.userId, input.refreshTokenHash, input.expiresAt],
    );

    return result.rows[0] as AuthSessionRow;
  }

  async findActiveByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSessionRow | null> {
    const result = await this.database.query<AuthSessionRow>(
      `SELECT
        id,
        user_id AS "userId",
        refresh_token_hash AS "refreshTokenHash",
        expires_at AS "expiresAt",
        revoked_at AS "revokedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM auth_sessions
       WHERE refresh_token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > now()
       LIMIT 1`,
      [refreshTokenHash],
    );

    return result.rows[0] ?? null;
  }

  async revokeByRefreshTokenHash(refreshTokenHash: string): Promise<boolean> {
    const result = await this.database.query(
      `UPDATE auth_sessions
       SET revoked_at = COALESCE(revoked_at, now()), updated_at = now()
       WHERE refresh_token_hash = $1
         AND revoked_at IS NULL`,
      [refreshTokenHash],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
