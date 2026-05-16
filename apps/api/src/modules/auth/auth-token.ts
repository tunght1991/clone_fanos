import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import type { AuthPrincipal, AuthSessionClaims } from './auth.types.js';

export interface AuthTokenConfig {
  issuer: string;
  secret: string;
  tokenTtlSeconds: number;
}

export class AuthTokenService {
  constructor(private readonly config: AuthTokenConfig) {}

  issueToken(principal: AuthPrincipal): { token: string; expiresAt: Date; claims: AuthSessionClaims } {
    const issuedAt = Math.floor(Date.now() / 1000);
    const exp = issuedAt + this.config.tokenTtlSeconds;
    const claims: AuthSessionClaims = {
      sub: principal.userId,
      email: principal.email,
      displayName: principal.displayName,
      role: principal.role,
      iss: this.config.issuer,
      iat: issuedAt,
      exp,
      jti: randomUUID(),
    };

    return {
      token: this.signClaims(claims),
      expiresAt: new Date(exp * 1000),
      claims,
    };
  }

  verifyToken(token: string): AuthSessionClaims | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerPart, payloadPart, signaturePart] = parts;
    if (!headerPart || !payloadPart || !signaturePart) {
      return null;
    }

    const expectedSignature = this.sign(`${headerPart}.${payloadPart}`);

    if (!safeEqualBase64Url(signaturePart, expectedSignature)) {
      return null;
    }

    const payloadJson = decodeBase64Url(payloadPart);
    if (!payloadJson) {
      return null;
    }

    let claims: AuthSessionClaims;
    try {
      claims = JSON.parse(payloadJson) as AuthSessionClaims;
    } catch {
      return null;
    }

    if (claims.iss !== this.config.issuer) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(claims.exp) || claims.exp <= now) {
      return null;
    }

    if (!claims.sub || !claims.email || !claims.displayName || !claims.role) {
      return null;
    }

    return claims;
  }

  private signClaims(claims: AuthSessionClaims): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const headerPart = encodeBase64Url(JSON.stringify(header));
    const payloadPart = encodeBase64Url(JSON.stringify(claims));
    const signaturePart = this.sign(`${headerPart}.${payloadPart}`);

    return [headerPart, payloadPart, signaturePart].join('.');
  }

  private sign(input: string): string {
    return createHmac('sha256', this.config.secret).update(input).digest('base64url');
  }
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function safeEqualBase64Url(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left, 'base64url');
  const rightBuffer = Buffer.from(right, 'base64url');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
