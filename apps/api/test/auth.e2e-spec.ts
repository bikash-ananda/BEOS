import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { IdentitySeedService } from '../src/rbac/identity-seed.service';

const adminEmail = 'e2e-admin@example.test';
const employeeEmail = 'e2e-employee@example.test';
const testEmails = [adminEmail, employeeEmail];
const adminPassword = 'Admin-Password-2026!';
const employeePassword = 'Employee-Password-2026!';
const resetPassword = 'Reset-Password-2026!';
const finalPassword = 'Final-Password-2026!';

function extractCookie(
  response: { headers: Record<string, unknown> },
  name: string,
): string {
  const values = response.headers['set-cookie'];
  if (!Array.isArray(values)) throw new Error('Expected response cookies');

  const cookie = values.find(
    (value): value is string =>
      typeof value === 'string' && value.startsWith(`${name}=`),
  );
  if (!cookie) throw new Error(`Expected ${name} cookie`);
  return cookie.split(';', 1)[0];
}

describe('Identity and access (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  async function cleanTestIdentity(): Promise<void> {
    const users = await prisma.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    });
    const userIds = users.map(({ id }) => id);

    await prisma.passwordReset.deleteMany({
      where: {
        OR: [{ userId: { in: userIds } }, { createdById: { in: userIds } }],
      },
    });
    await prisma.invitation.deleteMany({
      where: {
        OR: [{ email: { in: testEmails } }, { invitedById: { in: userIds } }],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await cleanTestIdentity();
    await app.get(IdentitySeedService).bootstrapAdmin({
      email: adminEmail,
      fullName: 'E2E Administrator',
      password: adminPassword,
    });
  });

  afterAll(async () => {
    await cleanTestIdentity();
    await app.close();
  });

  it('enforces invitation, rotation, replay, reset, and logout boundaries', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    const adminAgent = request.agent(app.getHttpServer());
    await adminAgent
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    const meResponse = await adminAgent.get('/api/v1/auth/me').expect(200);
    expect(meResponse.body).toMatchObject({
      user: {
        email: adminEmail,
        roles: ['Super Admin'],
      },
    });

    const engineerRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'Engineer' },
    });
    const invitationResponse = await adminAgent
      .post('/api/v1/identity/invitations')
      .send({ email: employeeEmail, roleIds: [engineerRole.id] })
      .expect(201);
    const invitationBody = invitationResponse.body as {
      id: string;
      token: string;
    };

    const expiredResponse = await adminAgent
      .post('/api/v1/identity/invitations')
      .send({ email: 'expired@example.test', roleIds: [engineerRole.id] })
      .expect(201);
    const expiredInvitation = expiredResponse.body as {
      id: string;
      token: string;
    };
    await prisma.invitation.update({
      where: { id: expiredInvitation.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invite')
      .send({
        token: expiredInvitation.token,
        fullName: 'Expired Employee',
        password: employeePassword,
      })
      .expect(400);

    const revokedResponse = await adminAgent
      .post('/api/v1/identity/invitations')
      .send({ email: 'revoked@example.test', roleIds: [engineerRole.id] })
      .expect(201);
    const revokedInvitation = revokedResponse.body as {
      id: string;
      token: string;
    };
    await adminAgent
      .post(`/api/v1/identity/invitations/${revokedInvitation.id}/revoke`)
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invite')
      .send({
        token: revokedInvitation.token,
        fullName: 'Revoked Employee',
        password: employeePassword,
      })
      .expect(400);

    const acceptResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invite')
      .send({
        token: invitationBody.token,
        fullName: 'E2E Employee',
        password: employeePassword,
      })
      .expect(201);
    const originalRefreshCookie = extractCookie(acceptResponse, 'beos_refresh');

    await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invite')
      .send({
        token: invitationBody.token,
        fullName: 'E2E Employee',
        password: employeePassword,
      })
      .expect(400);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalRefreshCookie)
      .expect(200);
    const rotatedAccessCookie = extractCookie(refreshResponse, 'beos_access');

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalRefreshCookie)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', rotatedAccessCookie)
      .expect(401);

    const resetResponse = await adminAgent
      .post('/api/v1/identity/password-resets')
      .send({ email: employeeEmail })
      .expect(201);
    const resetBody = resetResponse.body as { token: string };
    await request(app.getHttpServer())
      .post('/api/v1/auth/complete-password-reset')
      .send({ token: resetBody.token, password: resetPassword })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: employeePassword })
      .expect(401);
    const employeeAgent = request.agent(app.getHttpServer());
    await employeeAgent
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: resetPassword })
      .expect(200);
    await employeeAgent
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: resetPassword, newPassword: finalPassword })
      .expect(204);
    await employeeAgent.get('/api/v1/auth/me').expect(401);

    const finalAgent = request.agent(app.getHttpServer());
    await finalAgent
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: finalPassword })
      .expect(200);
    await finalAgent
      .post('/api/v1/identity/invitations')
      .send({ email: 'forbidden@example.test', roleIds: [engineerRole.id] })
      .expect(403);
    const activeEmployee = await prisma.user.findUniqueOrThrow({
      where: { email: employeeEmail },
    });
    await prisma.user.update({
      where: { id: activeEmployee.id },
      data: { isActive: false },
    });
    await finalAgent.get('/api/v1/auth/me').expect(401);
    await prisma.user.update({
      where: { id: activeEmployee.id },
      data: { isActive: true },
    });
    await finalAgent.post('/api/v1/auth/logout-all').expect(204);
    await finalAgent.get('/api/v1/auth/me').expect(401);

    const logoutAgent = request.agent(app.getHttpServer());
    await logoutAgent
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: finalPassword })
      .expect(200);
    await logoutAgent.post('/api/v1/auth/logout').expect(204);
    await logoutAgent.get('/api/v1/auth/me').expect(401);

    const employee = await prisma.user.findUniqueOrThrow({
      where: { email: employeeEmail },
    });
    expect(
      await prisma.auditLog.count({ where: { userId: employee.id } }),
    ).toBeGreaterThanOrEqual(5);
  });
});
