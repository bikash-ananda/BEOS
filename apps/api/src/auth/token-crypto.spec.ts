import {
  createTokenSecret,
  hashTokenSecret,
  parseOpaqueToken,
  serializeOpaqueToken,
  tokenSecretMatches,
} from './token-crypto';

describe('opaque token utilities', () => {
  it('serializes, parses, and verifies a token secret', () => {
    const secret = createTokenSecret();
    const token = serializeOpaqueToken('session-id', secret);

    expect(parseOpaqueToken(token)).toEqual({ id: 'session-id', secret });
    expect(tokenSecretMatches(secret, hashTokenSecret(secret))).toBe(true);
    expect(tokenSecretMatches(`${secret}x`, hashTokenSecret(secret))).toBe(
      false,
    );
  });

  it('rejects malformed opaque tokens', () => {
    expect(parseOpaqueToken('missing-separator')).toBeNull();
    expect(parseOpaqueToken('.missing-id')).toBeNull();
    expect(parseOpaqueToken('missing-secret.')).toBeNull();
  });
});
