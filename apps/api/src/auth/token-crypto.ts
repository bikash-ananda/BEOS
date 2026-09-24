import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function createTokenSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function hashTokenSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function tokenSecretMatches(
  secret: string,
  expectedHash: string,
): boolean {
  const actual = Buffer.from(hashTokenSecret(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function serializeOpaqueToken(id: string, secret: string): string {
  return `${id}.${secret}`;
}

export function parseOpaqueToken(
  token: string,
): { id: string; secret: string } | null {
  const separator = token.indexOf('.');
  if (separator <= 0 || separator === token.length - 1) return null;

  return {
    id: token.slice(0, separator),
    secret: token.slice(separator + 1),
  };
}
