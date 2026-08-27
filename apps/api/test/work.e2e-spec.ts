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

const emails = [
  'work-e2e-admin@example.test',
  'work-e2e-alice@example.test',
  'work-e2e-bob@example.test',
];
const password = 'Work-Password-2026!';

describe('Meetings and tasks (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let admin: ReturnType<typeof request.agent>;
  let alice: ReturnType<typeof request.agent>;
  let bob: ReturnType<typeof request.agent>;
  let aliceId: string;
  let fileId: string;
  let baseUrl: string;
  let adminCookie: string;

  async function cleanup() {
    await prisma.meeting.deleteMany({
      where: { organizer: { email: { in: emails } } },
    });
    await prisma.workTask.deleteMany({
      where: { createdBy: { email: { in: emails } } },
    });
    await prisma.fileRecord.deleteMany({
      where: { storageKey: 'work-e2e-file' },
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

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    prisma = app.get(PrismaService);
    await cleanup();
    await app
      .get(IdentitySeedService)
      .bootstrapAdmin({ email: emails[0], fullName: 'Work Admin', password });
    admin = request.agent(app.getHttpServer());
    alice = request.agent(app.getHttpServer());
    bob = request.agent(app.getHttpServer());
    const login = await admin
      .post('/api/v1/auth/login')
      .send({ email: emails[0], password })
      .expect(200);
    adminCookie = cookieHeader(login);
    const roles = await admin.get('/api/v1/identity/roles').expect(200);
    const engineer = (roles.body as Array<{ id: string; name: string }>).find(
      ({ name }) => name === 'Engineer',
    )!;
    for (const [index, agent] of [alice, bob].entries()) {
      const invite = await admin
        .post('/api/v1/identity/invitations')
        .send({ email: emails[index + 1], roleIds: [engineer.id] })
        .expect(201);
      await agent
        .post('/api/v1/auth/accept-invite')
        .send({
          token: body<{ token: string }>(invite).token,
          fullName: index === 0 ? 'Work Alice' : 'Work Bob',
          password,
        })
        .expect(201);
    }
    aliceId = (
      await prisma.user.findUniqueOrThrow({ where: { email: emails[1] } })
    ).id;
    const record = await prisma.fileRecord.create({
      data: {
        originalName: 'work-note.txt',
        storageKey: 'work-e2e-file',
        mimeType: 'text/plain',
        sizeBytes: 4,
        sha256: 'test',
        uploadedBy: { connect: { email: emails[0] } },
        workspaceAttachments: { create: { scope: 'COMPANY' } },
      },
    });
    fileId = record.id;
    const httpServer = app.getHttpServer() as { address(): AddressInfo };
    baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('keeps meetings private to participants and persists RSVP and outcomes', async () => {
    const meeting = await admin
      .post('/api/v1/work/meetings')
      .send({
        title: 'Iteration review',
        startsAt: '2026-09-01T04:00:00.000Z',
        endsAt: '2026-09-01T05:00:00.000Z',
        participantIds: [aliceId],
      })
      .expect(201);
    const meetingId = body<{ id: string }>(meeting).id;
    await alice.get(`/api/v1/work/meetings/${meetingId}`).expect(200);
    await bob.get(`/api/v1/work/meetings/${meetingId}`).expect(404);
    await alice
      .post(`/api/v1/work/meetings/${meetingId}/rsvp`)
      .send({ rsvp: 'ACCEPTED' })
      .expect(201);
    const agenda = await admin
      .post(`/api/v1/work/meetings/${meetingId}/agenda`)
      .send({ title: 'Review open work' })
      .expect(201);
    const agendaItemId = body<{ id: string }>(agenda).id;
    await alice
      .post(`/api/v1/work/meetings/${meetingId}/notes`)
      .send({ kind: 'MINUTE', agendaItemId, body: 'Open work was reviewed.' })
      .expect(201);
    await admin
      .post(`/api/v1/work/meetings/${meetingId}/decisions`)
      .send({ agendaItemId, body: 'Proceed with the verified scope.' })
      .expect(201);
    await admin
      .post(`/api/v1/work/meetings/${meetingId}/attachments`)
      .send({ fileId })
      .expect(201);
    const detail = await alice
      .get(`/api/v1/work/meetings/${meetingId}`)
      .expect(200);
    const agendaRecord = body<{
      agendaItems: Array<{ notes: unknown[]; decisions: unknown[] }>;
    }>(detail).agendaItems[0];
    expect(agendaRecord.notes).toHaveLength(1);
    expect(agendaRecord.decisions).toHaveLength(1);
  });

  it('enforces task membership and supports assignment lifecycle, comments, and attachments', async () => {
    const task = await admin
      .post('/api/v1/work/tasks')
      .send({
        title: 'Prepare verified minutes',
        priority: 'HIGH',
        dueAt: '2026-09-02T12:00:00.000Z',
        assigneeIds: [aliceId],
      })
      .expect(201);
    const taskId = body<{ id: string }>(task).id;
    const aliceSession = await alice.get('/api/v1/auth/me').expect(200);
    expect(
      body<{ user: { permissions: string[] } }>(aliceSession).user.permissions,
    ).toEqual(expect.arrayContaining(['tasks.read', 'tasks.write']));
    await alice.get(`/api/v1/work/tasks/${taskId}`).expect(200);
    await bob.get(`/api/v1/work/tasks/${taskId}`).expect(404);
    await alice
      .patch(`/api/v1/work/tasks/${taskId}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    await alice
      .post(`/api/v1/work/tasks/${taskId}/comments`)
      .send({ body: 'Drafting the minutes now.' })
      .expect(201);
    await admin
      .post(`/api/v1/work/tasks/${taskId}/attachments`)
      .send({ fileId })
      .expect(201);
    const detail = await alice.get(`/api/v1/work/tasks/${taskId}`).expect(200);
    const taskRecord = body<{
      status: string;
      comments: unknown[];
      attachments: unknown[];
    }>(detail);
    expect(taskRecord.status).toBe('IN_PROGRESS');
    expect(taskRecord.comments).toHaveLength(1);
    expect(taskRecord.attachments).toHaveLength(1);
  });

  it('delivers authenticated workspace task events', async () => {
    const socket = io(`${baseUrl}/workspace`, {
      path: '/api/v1/socket.io',
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
      extraHeaders: { cookie: adminCookie },
    });
    await once(socket, 'workspace:ready');
    const changed = once<{ resource: string; action: string }>(
      socket,
      'workspace:changed',
    );
    await admin
      .post('/api/v1/work/tasks')
      .send({ title: 'Verify live work event', assigneeIds: [aliceId] })
      .expect(201);
    await expect(changed).resolves.toMatchObject({
      resource: 'task',
      action: 'created',
    });
    socket.disconnect();
  });
});

function body<T>(response: Response): T {
  return response.body as T;
}
function cookieHeader(response: Response) {
  const values = response.headers['set-cookie'] as
    string | string[] | undefined;
  return (Array.isArray(values) ? values : [values])
    .filter(Boolean)
    .map((value) => value!.split(';')[0])
    .join('; ');
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
