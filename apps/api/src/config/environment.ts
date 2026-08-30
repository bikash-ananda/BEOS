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
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  FILE_STORAGE_PATH: z.string().min(1).default('./uploads'),
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
  };
  const result = environmentSchema.safeParse(normalizedConfig);

  if (!result.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(result.error)}`);
  }

  validateOrigins(result.data.WEB_ORIGIN);

  if (
    result.data.NODE_ENV === 'production' &&
    !result.data.AUTH_COOKIE_SECURE
  ) {
    throw new Error('AUTH_COOKIE_SECURE must be true in production');
  }

  return result.data;
}

export function parseWebOrigins(value: string): string[] {
  return value.split(',').map((origin) => origin.trim());
}
