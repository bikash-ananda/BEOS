import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IdentitySeedService } from '../rbac/identity-seed.service';

async function seed(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    await application.get(IdentitySeedService).seedRbac();
    process.stdout.write('System roles and permissions are ready\n');
  } finally {
    await application.close();
  }
}

seed().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : 'RBAC seed failed',
    undefined,
    'SeedRbac',
  );
  process.exitCode = 1;
});
