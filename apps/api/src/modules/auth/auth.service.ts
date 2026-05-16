import type {
  AuthLoginRequestDto,
  AuthLogoutRequestDto,
  AuthLogoutResponseDto,
  AuthRefreshRequestDto,
  AuthRegisterRequestDto,
  AuthSessionDto,
  AuthUserProfileDto,
} from './auth.dto.js';
import { hasRequiredRole } from './auth.policy.js';
import { hashPassword, verifyPassword } from './password-hash.js';
import { hashRefreshToken, generateRefreshToken } from './refresh-token.js';
import type { AuthRepositoryBundle } from './auth.repository.js';
import type { AuthTokenService } from './auth-token.js';
import type { AuthPrincipal, AuthUserRow, AuthUserRole } from './auth.types.js';

export interface AuthServiceDependencies {
  repositories: AuthRepositoryBundle;
  tokenService: AuthTokenService;
  refreshTokenTtlSeconds: number;
}

export class AuthService {
  constructor(private readonly dependencies: AuthServiceDependencies) {}

  async register(request: AuthRegisterRequestDto): Promise<AuthSessionDto> {
    const normalizedEmail = normalizeEmail(request.email);
    const existing = await this.dependencies.repositories.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`User with email ${normalizedEmail} already exists`);
    }

    const passwordHash = hashPassword(request.password);
    const user = await this.dependencies.repositories.userRepository.createUser({
      email: normalizedEmail,
      passwordHash,
      displayName: normalizeDisplayName(request.displayName),
      avatarAssetKey: request.avatarAssetKey ?? null,
      role: 'user',
      isActive: true,
    });

    return this.createSession(user);
  }

  async login(request: AuthLoginRequestDto): Promise<AuthSessionDto> {
    const normalizedEmail = normalizeEmail(request.email);
    const user = await this.dependencies.repositories.userRepository.findByEmail(normalizedEmail);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    if (!verifyPassword(request.password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    return this.createSession(user);
  }

  async me(userId: string): Promise<AuthUserProfileDto | null> {
    const user = await this.dependencies.repositories.userRepository.findById(userId);
    return user ? this.mapProfile(user) : null;
  }

  async resolvePrincipalFromToken(token: string): Promise<AuthPrincipal | null> {
    const claims = this.dependencies.tokenService.verifyToken(token);
    if (!claims) {
      return null;
    }

    const user = await this.dependencies.repositories.userRepository.findById(claims.sub);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async refresh(request: AuthRefreshRequestDto): Promise<AuthSessionDto> {
    const refreshTokenHash = hashRefreshToken(request.refreshToken);
    const session = await this.dependencies.repositories.sessionRepository.findActiveByRefreshTokenHash(
      refreshTokenHash,
    );
    if (!session) {
      throw new Error('Invalid refresh token');
    }

    const user = await this.dependencies.repositories.userRepository.findById(session.userId);
    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    await this.dependencies.repositories.sessionRepository.revokeByRefreshTokenHash(refreshTokenHash);
    return this.createSession(user);
  }

  async logout(request: AuthLogoutRequestDto): Promise<AuthLogoutResponseDto> {
    const refreshTokenHash = hashRefreshToken(request.refreshToken);
    const revoked = await this.dependencies.repositories.sessionRepository.revokeByRefreshTokenHash(refreshTokenHash);
    return { revoked };
  }

  async assertRole(userId: string, requiredRole: AuthUserRole): Promise<void> {
    const user = await this.dependencies.repositories.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (!hasRequiredRole(user.role, requiredRole)) {
      throw new Error(`User ${userId} requires role ${requiredRole}`);
    }
  }

  private async createSession(user: AuthUserRow): Promise<AuthSessionDto> {
    const principal = this.mapPrincipal(user);
    const issued = this.dependencies.tokenService.issueToken(principal);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + this.dependencies.refreshTokenTtlSeconds * 1000);

    await this.dependencies.repositories.sessionRepository.createSession({
      userId: user.id,
      refreshTokenHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      tokenType: 'Bearer',
      accessToken: issued.token,
      refreshToken,
      expiresAt: issued.expiresAt.toISOString(),
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      user: this.mapProfile(user),
    };
  }

  private mapPrincipal(user: AuthUserRow): AuthPrincipal {
    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  private mapProfile(user: AuthUserRow): AuthUserProfileDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarAssetKey: user.avatarAssetKey,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Invalid email');
  }

  return normalized;
}

function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.trim();
  if (!normalized) {
    throw new Error('Display name is required');
  }

  return normalized;
}
