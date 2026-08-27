import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import { io, Socket } from 'socket.io-client';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { IdentitySeedService } from '../src/rbac/identity-seed.service';

interface Identified {
  id: string;
}

interface InvitationBody {
  token: string;
}

interface ListBody<T> {
  items: T[];
  total: number;
}

const adminEmail = 'communication-e2e-admin@example.test';
const aliceEmail = 'communication-e2e-alice@example.test';
const bobEmail = 'communication-e2e-bob@example.test';
const password = 'Communication-Password-2026!';

describe('Workspace communication (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let baseUrl: string;
  let adminCookie: string;
  let adminAgent: ReturnType<typeof request.agent>;
  let aliceAgent: ReturnType<typeof request.agent>;
  let bobAgent: ReturnType<typeof request.agent>;

  async function cleanup() {
    const emails = [adminEmail, aliceEmail, bobEmail];
    await prisma.announcement.deleteMany({
      where: { author: { email: { in: emails } } },
    });
    await prisma.conversation.deleteMany({
      where: { createdBy: { email: { in: emails } } },
    });
    await prisma.discussion.deleteMany({
      where: { author: { email: { in: emails } } },
    });
    await prisma.invitation.deleteMany({
      where: {
        OR: [
          { email: { in: emails } },
          { invitedBy: { email: { in: emails } } },
        ],
      },
    });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
  }

  async function login(agent: ReturnType<typeof request.agent>, email: string) {
    return agent
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
  }

  async function inviteEmployee(
    adminAgent: ReturnType<typeof request.agent>,
    email: string,
    fullName: string,
    roleId: string,
  ) {
    const invitation = await adminAgent
      .post('/api/v1/identity/invitations')
      .send({ email, roleIds: [roleId] })
      .expect(201);
    const invitationBody = responseBody<InvitationBody>(invitation);
    const employee = email === aliceEmail ? aliceAgent : bobAgent;
    await employee
      .post('/api/v1/auth/accept-invite')
      .send({ token: invitationBody.token, fullName, password })
      .expect(201);
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    prisma = app.get(PrismaService);
    await cleanup();
    await app.get(IdentitySeedService).bootstrapAdmin({
      email: adminEmail,
      fullName: 'Communication E2E Admin',
      password,
    });
    adminAgent = request.agent(app.getHttpServer());
    aliceAgent = request.agent(app.getHttpServer());
    bobAgent = request.agent(app.getHttpServer());
    const loginResponse = await login(adminAgent, adminEmail);
    adminCookie = cookieHeader(loginResponse);
    const roles = await adminAgent.get('/api/v1/identity/roles').expect(200);
    const engineer = (roles.body as Array<{ id: string; name: string }>).find(
      ({ name }) => name === 'Engineer',
    );
    await inviteEmployee(
      adminAgent,
      aliceEmail,
      'Communication Alice',
      engineer!.id,
    );
    await inviteEmployee(
      adminAgent,
      bobEmail,
      'Communication Bob',
      engineer!.id,
    );
    const httpServer = app.getHttpServer() as { address(): AddressInfo };
    const address = httpServer.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('authorizes discussions, comments, reactions, editing, and soft deletion', async () => {
    const created = await adminAgent
      .post('/api/v1/communication/discussions')
      .send({
        title: 'Field coordination',
        body: 'Review the current work sequence.',
      })
      .expect(201);
    const id = responseBody<Identified>(created).id;
    await aliceAgent.get('/api/v1/communication/discussions').expect(200);
    const comment = await aliceAgent
      .post(`/api/v1/communication/discussions/${id}/comments`)
      .send({ body: 'Sequence reviewed.' })
      .expect(201);
    await aliceAgent
      .put(`/api/v1/communication/discussions/${id}/reaction`)
      .send({ kind: 'ACKNOWLEDGE' })
      .expect(200);
    await aliceAgent
      .patch(`/api/v1/communication/discussions/${id}`)
      .send({ title: 'Unauthorized change' })
      .expect(403);
    const commentId = responseBody<Identified>(comment).id;
    await aliceAgent
      .patch(`/api/v1/communication/discussions/comments/${commentId}`)
      .send({ body: 'Sequence reviewed and confirmed.' })
      .expect(200);
    await adminAgent
      .delete(`/api/v1/communication/discussions/${id}`)
      .expect(200);
    const list = await aliceAgent
      .get('/api/v1/communication/discussions')
      .expect(200);
    expect(responseBody<ListBody<Identified>>(list).items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id })]),
    );
  });

  it('enforces direct membership, message ordering, edits, and read receipts', async () => {
    const bobRecord = await prisma.user.findUniqueOrThrow({
      where: { email: bobEmail },
    });
    const conversation = await aliceAgent
      .post('/api/v1/communication/conversations')
      .send({ type: 'DIRECT', memberIds: [bobRecord.id] })
      .expect(201);
    const id = responseBody<Identified>(conversation).id;
    const first = await aliceAgent
      .post(`/api/v1/communication/conversations/${id}/messages`)
      .send({ body: 'First message' })
      .expect(201);
    await bobAgent
      .post(`/api/v1/communication/conversations/${id}/messages`)
      .send({ body: 'Second message' })
      .expect(201);
    const messages = await bobAgent
      .get(`/api/v1/communication/conversations/${id}/messages`)
      .expect(200);
    expect(
      responseBody<ListBody<{ body: string }>>(messages).items.map(
        (item) => item.body,
      ),
    ).toEqual(['First message', 'Second message']);
    await adminAgent
      .get(`/api/v1/communication/conversations/${id}/messages`)
      .expect(404);
    const firstId = responseBody<Identified>(first).id;
    await aliceAgent
      .patch(`/api/v1/communication/messages/${firstId}`)
      .send({ body: 'First message edited' })
      .expect(200);
    await bobAgent
      .post(`/api/v1/communication/conversations/${id}/read`)
      .expect(201);
    const details = await aliceAgent
      .get(`/api/v1/communication/conversations/${id}`)
      .expect(200);
    const detailsBody = responseBody<{
      receipts: Array<{ user: { fullName: string } }>;
    }>(details);
    expect(
      detailsBody.receipts.some(
        ({ user: receiptUser }) => receiptUser.fullName === 'Communication Bob',
      ),
    ).toBe(true);
  });

  it('targets announcements and persists recipient read state', async () => {
    const bobRecord = await prisma.user.findUniqueOrThrow({
      where: { email: bobEmail },
    });
    const announcement = await adminAgent
      .post('/api/v1/communication/announcements')
      .send({
        title: 'Targeted notice',
        body: 'This notice is for the selected recipient.',
        target: 'USERS',
        userIds: [bobRecord.id],
      })
      .expect(201);
    const bobList = await bobAgent
      .get('/api/v1/communication/announcements')
      .expect(200);
    expect(responseBody<ListBody<unknown>>(bobList).total).toBe(1);
    const aliceList = await aliceAgent
      .get('/api/v1/communication/announcements')
      .expect(200);
    expect(responseBody<ListBody<unknown>>(aliceList).total).toBe(0);
    const announcementId = responseBody<Identified>(announcement).id;
    await bobAgent
      .post(`/api/v1/communication/announcements/${announcementId}/read`)
      .expect(201);
    const readList = await bobAgent
      .get('/api/v1/communication/announcements')
      .expect(200);
    expect(
      responseBody<ListBody<{ readAt: string | null }>>(readList).items[0]
        .readAt,
    ).toBeTruthy();
  });

  it('authenticates live events and recovers after reconnect', async () => {
    const socket = createSocket(baseUrl, adminCookie);
    await once(socket, 'workspace:ready');
    const changed = once<{ resource: string; action: string }>(
      socket,
      'workspace:changed',
    );
    await adminAgent
      .post('/api/v1/communication/discussions')
      .send({ title: 'Live delivery', body: 'Verify the persisted event.' })
      .expect(201);
    await expect(changed).resolves.toMatchObject({
      resource: 'discussion',
      action: 'created',
    });
    socket.disconnect();
    socket.connect();
    await once(socket, 'workspace:ready');
    socket.disconnect();

    const unauthenticated = createSocket(baseUrl);
    await once(unauthenticated, 'disconnect');
    expect(unauthenticated.connected).toBe(false);
  });
});

function cookieHeader(response: Response) {
  const values = response.headers['set-cookie'] as
    string | string[] | undefined;
  const cookies = Array.isArray(values) ? values : [values];
  return cookies
    .filter(Boolean)
    .map((value) => value!.split(';')[0])
    .join('; ');
}

function responseBody<T>(response: Response): T {
  return response.body as T;
}

function createSocket(baseUrl: string, cookie?: string) {
  return io(`${baseUrl}/workspace`, {
    path: '/api/v1/socket.io',
    transports: ['websocket'],
    reconnection: false,
    forceNew: true,
    ...(cookie && { extraHeaders: { cookie } }),
  });
}

function once<T = unknown>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      5_000,
    );
    socket.once(event, (value: T) => {
      clearTimeout(timeout);
      resolve(value);
    });
    socket.once('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
