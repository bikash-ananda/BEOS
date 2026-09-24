import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { IdentitySeedService } from '../src/rbac/identity-seed.service';

const adminEmail = 'admin-console-e2e@example.test';
const adminPassword = 'Administration-Password-2026!';
const branchCode = 'E2E-KTM';
const roleName = 'E2E Project Coordinator';

describe('Administration (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  async function cleanup() {
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    const branch = await prisma.branch.findUnique({
      where: { code: branchCode },
    });
    const role = await prisma.role.findUnique({ where: { name: roleName } });

    if (admin) {
      await prisma.invitation.deleteMany({
        where: {
          OR: [
            { invitedById: admin.id },
            { email: 'administration-invite@example.test' },
          ],
        },
      });
      await prisma.passwordReset.deleteMany({
        where: { OR: [{ userId: admin.id }, { createdById: admin.id }] },
      });
      await prisma.user.delete({ where: { id: admin.id } });
    }
    if (role) await prisma.role.delete({ where: { id: role.id } });
    if (branch) {
      await prisma.department.deleteMany({ where: { branchId: branch.id } });
      await prisma.branch.delete({ where: { id: branch.id } });
    }
  }

  beforeAll(async () => {
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
      fullName: 'Administration E2E',
      password: adminPassword,
    });
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('manages organization, roles, users, and invitations', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const branchResponse = await agent
      .post('/api/v1/identity/branches')
      .send({ name: 'Kathmandu E2E', code: branchCode, city: 'Kathmandu' })
      .expect(201);
    const branchBody = branchResponse.body as { id: string };
    const branchId = branchBody.id;

    await agent
      .post('/api/v1/identity/branches')
      .send({ name: 'Invalid branch', code: 'X'.repeat(21) })
      .expect(400);
    await agent
      .get(`/api/v1/identity/users?search=${'x'.repeat(121)}`)
      .expect(400);

    const departmentResponse = await agent
      .post('/api/v1/identity/departments')
      .send({ name: 'Delivery E2E', code: 'DEL', branchId })
      .expect(201);
    const departmentBody = departmentResponse.body as {
      id: string;
      code: string;
      branchId: string;
    };
    expect(departmentBody).toMatchObject({
      code: 'DEL',
      branchId,
    });

    const permissionsResponse = await agent
      .get('/api/v1/identity/permissions')
      .expect(200);
    const permissionBodies = permissionsResponse.body as Array<{
      id: string;
      key: string;
    }>;
    const workspacePermission = permissionBodies.find(
      (permission: { key: string }) => permission.key === 'workspace.access',
    ) as { id: string };

    const roleResponse = await agent
      .post('/api/v1/identity/roles')
      .send({
        name: roleName,
        description: 'Coordinates projects during the E2E test',
        permissionIds: [workspacePermission.id],
      })
      .expect(201);
    const roleBody = roleResponse.body as { id: string };
    await agent
      .patch(`/api/v1/identity/roles/${roleBody.id}`)
      .send({ description: 'Updated E2E role' })
      .expect(200);

    const systemRoles = await agent.get('/api/v1/identity/roles').expect(200);
    const systemRoleBodies = systemRoles.body as Array<{
      id: string;
      name: string;
      isSystem: boolean;
    }>;
    const systemRole = systemRoleBodies.find(
      (role: { name: string }) => role.name === 'Engineer',
    ) as { id: string; isSystem: boolean };
    expect(systemRole.isSystem).toBe(true);
    await agent
      .patch(`/api/v1/identity/roles/${systemRole.id}`)
      .send({ description: 'Should not change' })
      .expect(403);

    const inviteResponse = await agent
      .post('/api/v1/identity/invitations')
      .send({
        email: 'administration-invite@example.test',
        roleIds: [roleBody.id],
        branchId,
        departmentId: departmentBody.id,
      })
      .expect(201);
    const inviteBody = inviteResponse.body as { id: string };
    const invitations = await agent
      .get('/api/v1/identity/invitations')
      .expect(200);
    const invitationPage = invitations.body as {
      items: Array<Record<string, unknown>>;
      total: number;
      page: number;
      limit: number;
    };
    expect(invitationPage.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: inviteBody.id,
          status: 'pending',
        }),
      ]),
    );
    expect(
      invitationPage.items.some((invitation) => 'tokenHash' in invitation),
    ).toBe(false);
    expect(invitationPage).toMatchObject({ page: 1, limit: 25 });

    const users = await agent
      .get('/api/v1/identity/users?search=administration&page=1&limit=10')
      .expect(200);
    const usersBody = users.body as {
      items: Array<{ id: string }>;
      total: number;
      page: number;
      limit: number;
    };
    expect(usersBody).toMatchObject({ total: 1, page: 1, limit: 10 });
    await agent
      .patch(`/api/v1/identity/users/${usersBody.items[0].id}`)
      .send({ isActive: false })
      .expect(400);

    await agent
      .patch(`/api/v1/identity/departments/${departmentBody.id}`)
      .send({ isActive: false })
      .expect(200);
    await agent
      .patch(`/api/v1/identity/branches/${branchId}`)
      .send({ isActive: false })
      .expect(200);
  });
});
