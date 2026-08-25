import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnvironment } from './config/environment';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnvironment,
    }),
    LoggerModule.forRoot({
      forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
      pinoHttp: {
        genReqId: (request, response) => {
          const requestId = request.headers['x-request-id'] ?? randomUUID();
          response.setHeader('x-request-id', requestId);
          return requestId;
        },
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers.set-cookie',
        ],
      },
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
