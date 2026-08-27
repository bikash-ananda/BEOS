import { z } from 'zod';

const booleanFromEnvironment = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  API_RATE_LIMIT: z.coerce.number().int().min(1).max(10_000).default(100),
  API_RATE_TTL_MS: z.coerce.number().int().min(1_000).default(60_000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(2).default(0),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  FILE_STORAGE_PATH: z.string().min(1).default('./uploads'),
  FILE_MAX_SIZE_BYTES: z.coerce
    .number()
    .int()
    .min(1_024)
    .max(26_214_400)
    .default(10_485_760),
  FILE_USER_QUOTA_BYTES: z.coerce
    .number()
    .int()
    .min(1_024)
    .default(1_073_741_824),
  FILE_TOTAL_QUOTA_BYTES: z.coerce
    .number()
    .int()
    .min(1_024)
    .default(10_737_418_240),
  AUTH_ACCESS_SECRET: z.string().min(32),
  AUTH_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
  AUTH_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).default(30),
  AUTH_INVITE_TTL_HOURS: z.coerce.number().int().min(1).default(72),
  AUTH_RESET_TTL_HOURS: z.coerce.number().int().min(1).default(2),
  AUTH_COOKIE_SECURE: booleanFromEnvironment.default(false),
  AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

const testDatabaseUrl = 'postgresql://beos:beos@localhost:5432/beos_test';

function validateOrigins(value: string): void {
  const origins = value.split(',').map((origin) => origin.trim());

  if (origins.some((origin) => origin.length === 0)) {
    throw new Error('WEB_ORIGIN must contain valid comma-separated origins');
  }

  for (const origin of origins) {
    const url = new URL(origin);

    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error(
        `WEB_ORIGIN entry "${origin}" must be an HTTP(S) origin without a path`,
      );
    }
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const normalizedConfig = {
    ...config,
    DATABASE_URL:
      config.DATABASE_URL ??
      (config.NODE_ENV === 'test' ? testDatabaseUrl : undefined),
    AUTH_ACCESS_SECRET:
      config.AUTH_ACCESS_SECRET ??
      (config.NODE_ENV === 'test'
        ? 'test-only-access-secret-at-least-32-characters'
        : undefined),
  };
  const result = environmentSchema.safeParse(normalizedConfig);

  if (!result.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(result.error)}`);
  }

  validateOrigins(result.data.WEB_ORIGIN);

  if (result.data.FILE_USER_QUOTA_BYTES < result.data.FILE_MAX_SIZE_BYTES) {
    throw new Error(
      'FILE_USER_QUOTA_BYTES must be at least FILE_MAX_SIZE_BYTES',
    );
  }
  if (result.data.FILE_TOTAL_QUOTA_BYTES < result.data.FILE_USER_QUOTA_BYTES) {
    throw new Error(
      'FILE_TOTAL_QUOTA_BYTES must be at least FILE_USER_QUOTA_BYTES',
    );
  }

  if (
    result.data.NODE_ENV === 'production' &&
    !result.data.AUTH_COOKIE_SECURE
  ) {
    throw new Error('AUTH_COOKIE_SECURE must be true in production');
  }

  if (
    result.data.NODE_ENV === 'production' &&
    result.data.AUTH_ACCESS_SECRET.includes('change-me')
  ) {
    throw new Error('AUTH_ACCESS_SECRET must be replaced in production');
  }

  return result.data;
}

export function parseWebOrigins(value: string): string[] {
  return value.split(',').map((origin) => origin.trim());
}
