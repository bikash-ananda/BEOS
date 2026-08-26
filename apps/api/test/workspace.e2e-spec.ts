import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { IdentitySeedService } from '../src/rbac/identity-seed.service';

const adminEmail = 'workspace-e2e-admin@example.test';
const employeeEmail = 'workspace-e2e-employee@example.test';
const password = 'Workspace-Password-2026!';
const roleName = 'Workspace E2E Limited';

describe('Workspace files, notifications, and audit (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let storagePath: string;

  async function cleanup() {
    await prisma.workspaceAttachment.deleteMany({
      where: { file: { uploadedBy: { email: adminEmail } } },
    });
    await prisma.fileRecord.deleteMany({
      where: { uploadedBy: { email: adminEmail } },
    });
    await prisma.invitation.deleteMany({
      where: {
        OR: [{ email: employeeEmail }, { invitedBy: { email: adminEmail } }],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, employeeEmail] } },
    });
    await prisma.role.deleteMany({ where: { name: roleName } });
  }

  beforeAll(async () => {
    storagePath = await mkdtemp(join(tmpdir(), 'beos-files-e2e-'));
    process.env.FILE_STORAGE_PATH = storagePath;
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup();
    await app.get(IdentitySeedService).bootstrapAdmin({
      email: adminEmail,
      fullName: 'Workspace E2E Admin',
      password,
    });
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
    await rm(storagePath, { recursive: true, force: true });
    delete process.env.FILE_STORAGE_PATH;
  });

  it('stores validated files and exposes only authorized downloads', async () => {
    const admin = request.agent(app.getHttpServer());
    await admin
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);

    const permissions = await admin
      .get('/api/v1/identity/permissions')
      .expect(200);
    const workspacePermission = (
      permissions.body as Array<{ id: string; key: string }>
    ).find(({ key }) => key === 'workspace.access');
    const role = await admin
      .post('/api/v1/identity/roles')
      .send({
        name: roleName,
        description: 'Workspace access without file access',
        permissionIds: [workspacePermission!.id],
      })
      .expect(201);
    const roleBody = role.body as { id: string };
    const invitation = await admin
      .post('/api/v1/identity/invitations')
      .send({ email: employeeEmail, roleIds: [roleBody.id] })
      .expect(201);
    const invitationBody = invitation.body as { token: string };
    const employee = request.agent(app.getHttpServer());
    await employee
      .post('/api/v1/auth/accept-invite')
      .send({
        token: invitationBody.token,
        fullName: 'Limited Employee',
        password,
      })
      .expect(201);

    await employee.get('/api/v1/workspace/files').expect(403);
    const welcome = await employee.get('/api/v1/notifications').expect(200);
    expect(welcome.body).toMatchObject({ total: 1, unread: 1 });

    const uploaded = await admin
      .post('/api/v1/workspace/files')
      .query({ scope: 'COMPANY' })
      .attach('file', Buffer.from('%PDF-1.4\nBEOS iteration four\n%%EOF'), {
        filename: 'iteration-four.pdf',
        contentType: 'application/octet-stream',
      })
      .expect(201);
    const uploadedBody = uploaded.body as {
      id: string;
      originalName: string;
      mimeType: string;
    };
    expect(uploadedBody).toMatchObject({
      originalName: 'iteration-four.pdf',
      mimeType: 'application/pdf',
    });

    await admin
      .post('/api/v1/workspace/files')
      .query({ scope: 'COMPANY' })
      .attach('file', Buffer.from('%PDF-1.4\nwrong extension'), 'wrong.txt')
      .expect(400);
    await admin
      .post('/api/v1/workspace/files')
      .query({ scope: 'COMPANY' })
      .attach('file', Buffer.from('not an allowed format'), 'unsafe.exe')
      .expect(400);

    const files = await admin.get('/api/v1/workspace/files').expect(200);
    const filesBody = files.body as {
      items: Array<Record<string, unknown>>;
      total: number;
      page: number;
      limit: number;
    };
    expect(filesBody).toMatchObject({ total: 1, page: 1, limit: 25 });
    expect(filesBody.items[0]).toMatchObject({
      id: uploadedBody.id,
      workspaceAttachments: [{ scope: 'COMPANY' }],
    });
    await admin
      .get(`/api/v1/workspace/files/${uploadedBody.id}/download`)
      .expect('Content-Type', /application\/pdf/)
      .expect('Content-Disposition', /iteration-four\.pdf/)
      .expect(200);

    const audit = await admin
      .get('/api/v1/audit?search=workspace.file_uploaded')
      .expect(200);
    const auditBody = audit.body as { items: Array<Record<string, unknown>> };
    expect(auditBody.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'workspace.file_uploaded',
          entityId: uploadedBody.id,
        }),
      ]),
    );
  });

  it('persists unread state and supports read and read-all actions', async () => {
    const employee = request.agent(app.getHttpServer());
    await employee
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password })
      .expect(200);
    const page = await employee.get('/api/v1/notifications').expect(200);
    const pageBody = page.body as { items: Array<{ id: string }> };
    const notificationId = pageBody.items[0].id;

    await employee
      .get('/api/v1/notifications/unread-count')
      .expect(200, { count: 1 });
    await employee
      .post(`/api/v1/notifications/${notificationId}/read`)
      .expect(201);
    await employee
      .get('/api/v1/notifications/unread-count')
      .expect(200, { count: 0 });
    await employee
      .post('/api/v1/notifications/read-all')
      .expect(201, { updated: 0 });
    await employee.post('/api/v1/notifications/missing/read').expect(404);
  });
});
