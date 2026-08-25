import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import { AppModule } from '../app.module';
import { IdentitySeedService } from '../rbac/identity-seed.service';

const inputSchema = z.object({
  BOOTSTRAP_ADMIN_EMAIL: z.string().email(),
  BOOTSTRAP_ADMIN_NAME: z.string().min(2).max(120),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).max(128),
});

async function bootstrap(): Promise<void> {
  const input = inputSchema.parse(process.env);
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const service = application.get(IdentitySeedService);
    const user = await service.bootstrapAdmin({
      email: input.BOOTSTRAP_ADMIN_EMAIL,
      fullName: input.BOOTSTRAP_ADMIN_NAME,
      password: input.BOOTSTRAP_ADMIN_PASSWORD,
    });
    process.stdout.write(`Administrator ready: ${user.email} (${user.id})\n`);
  } finally {
    await application.close();
  }
}

bootstrap().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : 'Administrator bootstrap failed',
    undefined,
    'BootstrapAdmin',
  );
  process.exitCode = 1;
});
