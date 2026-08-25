import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/bootstrap/configure-app';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        isReady: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status?: unknown };

        if (body.status !== 'ok') {
          throw new Error('expected status ok');
        }

        expect(res.headers['x-request-id']).toEqual(expect.any(String));
        expect(res.headers['x-content-type-options']).toBe('nosniff');
      });
  });

  it('/api/v1/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/ready')
      .expect(200)
      .expect({
        status: 'ready',
        service: 'beos-api',
        database: 'connected',
      });
  });

  it('returns the standard API error shape', () => {
    return request(app.getHttpServer())
      .get('/api/v1/missing')
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          statusCode?: unknown;
          code?: unknown;
          path?: unknown;
          requestId?: unknown;
        };

        expect(body).toMatchObject({
          statusCode: 404,
          code: 'NOT_FOUND',
          path: '/api/v1/missing',
        });
        expect(body.requestId).toEqual(expect.any(String));
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
