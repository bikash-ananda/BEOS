import { parseWebOrigins, validateEnvironment } from './environment';

describe('environment configuration', () => {
  const baseEnvironment = {
    DATABASE_URL: 'postgresql://beos:beos@localhost:5432/beos',
    AUTH_ACCESS_SECRET: 'test-only-access-secret-at-least-32-characters',
  };

  it('applies safe local defaults', () => {
    const environment = validateEnvironment(baseEnvironment);

    expect(environment.API_PORT).toBe(3001);
    expect(environment.WEB_ORIGIN).toBe('http://localhost:3000');
    expect(environment.AUTH_COOKIE_SECURE).toBe(false);
  });

  it('rejects origins that include a path', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnvironment,
        WEB_ORIGIN: 'https://beos.example.com/workspace',
      }),
    ).toThrow('without a path');
  });

  it('requires secure authentication cookies in production', () => {
    expect(() =>
      validateEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('AUTH_COOKIE_SECURE must be true in production');
  });

  it('parses multiple allowed web origins', () => {
    expect(
      parseWebOrigins('https://beos.example.com, https://admin.example.com'),
    ).toEqual(['https://beos.example.com', 'https://admin.example.com']);
  });
});
