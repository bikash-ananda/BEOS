import { NestFactory } from '@nestjs/core';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppModule } from '../app.module';
import { configureApp } from '../bootstrap/configure-app';

async function exportOpenApi() {
  const output = resolve(process.argv[2] ?? 'openapi.json');
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = configureApp(app);
  await writeFile(output, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();
}

void exportOpenApi();
