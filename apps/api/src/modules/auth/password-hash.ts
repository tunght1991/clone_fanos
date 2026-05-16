import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';

const DEFAULT_ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string, salt = randomBytes(16)): string {
  const derivedKey = pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, KEY_LENGTH, DIGEST);
  return [
    'pbkdf2',
    DEFAULT_ITERATIONS.toString(10),
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [scheme, iterationsRaw, saltRaw, hashRaw] = storedHash.split('$');

  if (scheme !== 'pbkdf2' || !iterationsRaw || !saltRaw || !hashRaw) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const salt = Buffer.from(saltRaw, 'base64url');
  const expected = Buffer.from(hashRaw, 'base64url');
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, DIGEST);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

