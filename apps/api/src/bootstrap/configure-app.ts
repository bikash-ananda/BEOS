import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { ACCESS_COOKIE } from '../auth/auth.constants';
import { ApiExceptionFilter } from '../common/filters/api-exception.filter';
import { Environment, parseWebOrigins } from '../config/environment';
import { ConfiguredSocketIoAdapter } from '../live/configured-socket-io.adapter';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Environment, true>);
  const origins = parseWebOrigins(config.get('WEB_ORIGIN', { infer: true }));

  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: origins, credentials: true });
  app.useWebSocketAdapter(new ConfiguredSocketIoAdapter(app, origins));
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  const openApiConfig = new DocumentBuilder()
    .setTitle('BEOS API')
    .setDescription('Bikash Engineering Operating System API')
    .setVersion('1.0')
    .addCookieAuth(ACCESS_COOKIE)
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api/docs', app, document);
}
