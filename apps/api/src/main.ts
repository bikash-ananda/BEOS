import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { Environment } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Environment, true>);
  configureApp(app);

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
  Logger.log(`BEOS API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
