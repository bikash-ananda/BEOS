import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AdministrationModule } from './administration/administration.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { Environment, validateEnvironment } from './config/environment';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { RbacModule } from './rbac/rbac.module';
import { CommunicationModule } from './communication/communication.module';
import { WorkspaceLiveModule } from './live/workspace-live.module';
import { WorkModule } from './work/work.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnvironment,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          genReqId: (request, response) => {
            const supplied = request.headers['x-request-id'];
            const requestId =
              typeof supplied === 'string' && supplied.length <= 128
                ? supplied
                : randomUUID();
            response.setHeader('x-request-id', requestId);
            return requestId;
          },
          redact: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers.x-api-key',
            'req.query.token',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.token',
            'res.headers.set-cookie',
          ],
        },
      }),
    }),
    PrismaModule,
    AuditModule,
    NotificationsModule,
    FilesModule,
    WorkspaceLiveModule,
    CommunicationModule,
    WorkModule,
    RbacModule,
    AuthModule,
    AdministrationModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    PrismaService,
  ],

  exports: [
    PrismaService,
  ],
})
export class AppModule {}
