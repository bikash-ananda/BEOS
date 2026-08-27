import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth-user';
import { WorkspaceEventsService } from '../live/workspace-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTaskCommentDto,
  CreateTaskDto,
  LinkFileDto,
  UpdateTaskDto,
  WorkListQueryDto,
} from './dto/work.dto';
import { WorkAccessService } from './work-access.service';

const person = { select: { id: true, fullName: true } } as const;
const taskInclude = {
  createdBy: person,
  assignees: {
    include: { user: person },
    orderBy: { user: { fullName: 'asc' as const } },
  },
  meeting: { select: { id: true, title: true, startsAt: true } },
  agendaItem: { select: { id: true, title: true, position: true } },
  comments: {
    where: { deletedAt: null },
    include: { author: person },
    orderBy: { createdAt: 'asc' as const },
  },
  attachments: {
    include: {
      file: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  },
} satisfies Prisma.WorkTaskInclude;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkAccessService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly events: WorkspaceEventsService,
  ) {}

  async list(user: AuthenticatedUser, query: WorkListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.WorkTaskWhereInput = {
      AND: [
        this.access.taskWhere(user),
        ...(query.from || query.to
          ? [
              {
                dueAt: {
                  ...(query.from && { gte: new Date(query.from) }),
                  ...(query.to && { lte: new Date(query.to) }),
                },
              },
            ]
          : []),
      ],
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.workTask.findMany({
        where,
        include: {
          createdBy: person,
          assignees: { include: { user: person } },
          meeting: { select: { id: true, title: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: [
          { dueAt: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.workTask.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async get(user: AuthenticatedUser, id: string) {
    await this.access.assertTask(user, id);
    return this.prisma.workTask.findUniqueOrThrow({
      where: { id },
      include: taskInclude,
    });
  }

  async create(
    user: AuthenticatedUser,
    input: CreateTaskDto,
    ipAddress?: string,
  ) {
    if (input.meetingId) await this.access.assertMeeting(user, input.meetingId);
    if (input.agendaItemId) {
      if (!input.meetingId) {
        throw new ForbiddenException(
          'An agenda-linked task requires its meeting',
        );
      }
      if (
        (await this.prisma.meetingAgendaItem.count({
          where: { id: input.agendaItemId, meetingId: input.meetingId },
        })) !== 1
      ) {
        throw new ForbiddenException('Agenda item is unavailable');
      }
    }
    const assigneeIds = await this.access.activeUserIds(
      user,
      input.assigneeIds,
    );
    const created = await this.prisma.$transaction(async (tx) => {
      const task = await tx.workTask.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim(),
          priority: input.priority,
          dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
          meetingId: input.meetingId,
          agendaItemId: input.agendaItemId,
          createdById: user.id,
          assignees: {
            createMany: { data: assigneeIds.map((userId) => ({ userId })) },
          },
        },
        select: { id: true, title: true },
      });
      for (const userId of assigneeIds) {
        await this.notifications.create(
          {
            userId,
            type: 'WORKSPACE',
            title: task.title,
            message: 'A task was assigned to you.',
            href: `/work?task=${task.id}`,
            dedupeKey: `task:${task.id}:${userId}`,
          },
          tx,
        );
      }
      await this.audit.record(
        {
          action: 'work.task_created',
          entityType: 'WorkTask',
          entityId: task.id,
          userId: user.id,
          ipAddress,
          metadata: {
            assignees: assigneeIds.length,
            meetingId: input.meetingId,
          },
        },
        tx,
      );
      return task;
    });
    this.events.emitToUsers(this.recipients(user.id, assigneeIds), {
      resource: 'task',
      action: 'created',
      id: created.id,
      taskId: created.id,
      meetingId: input.meetingId,
    });
    return this.get(user, created.id);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateTaskDto,
    ipAddress?: string,
  ) {
    const current = await this.access.assertTask(user, id);
    const manager =
      current.createdById === user.id ||
      user.permissions.includes('tasks.manage');
    const changedFields = Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    const onlyStatus = changedFields.every((key) => key === 'status');
    if (!manager && !onlyStatus)
      throw new ForbiddenException(
        'Only the task creator can change task details',
      );
    const assigneeIds = input.assigneeIds
      ? await this.access.activeUserIds(user, input.assigneeIds)
      : current.assignees.map(({ userId }) => userId);
    await this.prisma.$transaction(async (tx) => {
      await tx.workTask.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.description !== undefined && {
            description: input.description.trim() || null,
          }),
          ...(input.priority && { priority: input.priority }),
          ...(input.status && {
            status: input.status,
            completedAt:
              input.status === TaskStatus.COMPLETED ? new Date() : null,
          }),
          ...(input.dueAt && { dueAt: new Date(input.dueAt) }),
          ...(input.assigneeIds && {
            assignees: {
              deleteMany: {},
              createMany: { data: assigneeIds.map((userId) => ({ userId })) },
            },
          }),
        },
      });
      await this.audit.record(
        {
          action: 'work.task_updated',
          entityType: 'WorkTask',
          entityId: id,
          userId: user.id,
          ipAddress,
          metadata: input.status ? { status: input.status } : undefined,
        },
        tx,
      );
    });
    this.events.emitToUsers(this.recipients(current.createdById, assigneeIds), {
      resource: 'task',
      action: 'updated',
      id,
      taskId: id,
      meetingId: current.meetingId ?? undefined,
    });
    return this.get(user, id);
  }

  async comment(
    user: AuthenticatedUser,
    id: string,
    input: CreateTaskCommentDto,
  ) {
    const task = await this.access.assertTask(user, id);
    const comment = await this.prisma.taskComment.create({
      data: { taskId: id, authorId: user.id, body: input.body.trim() },
      include: { author: person },
    });
    this.events.emitToUsers(
      this.recipients(
        task.createdById,
        task.assignees.map(({ userId }) => userId),
      ),
      {
        resource: 'task',
        action: 'updated',
        id,
        taskId: id,
        meetingId: task.meetingId ?? undefined,
      },
    );
    return comment;
  }

  async linkFile(user: AuthenticatedUser, id: string, input: LinkFileDto) {
    const task = await this.access.assertTask(user, id);
    await this.access.assertVisibleFile(user, input.fileId);
    const result = await this.prisma.taskAttachment.upsert({
      where: { taskId_fileId: { taskId: id, fileId: input.fileId } },
      create: { taskId: id, fileId: input.fileId },
      update: {},
      include: { file: true },
    });
    this.events.emitToUsers(
      this.recipients(
        task.createdById,
        task.assignees.map(({ userId }) => userId),
      ),
      {
        resource: 'task',
        action: 'updated',
        id,
        taskId: id,
        meetingId: task.meetingId ?? undefined,
      },
    );
    return result;
  }

  async summary(user: AuthenticatedUser) {
    const now = new Date();
    const taskWhere = this.access.taskWhere(user);
    const meetingWhere = this.access.meetingWhere(user);
    const [upcomingMeetings, dueTasks, overdueTasks] =
      await this.prisma.$transaction([
        this.prisma.meeting.count({
          where: {
            AND: [meetingWhere],
            startsAt: { gte: now },
            status: 'SCHEDULED',
          },
        }),
        this.prisma.workTask.count({
          where: {
            AND: [taskWhere],
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
        }),
        this.prisma.workTask.count({
          where: {
            AND: [taskWhere],
            dueAt: { lt: now },
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
        }),
      ]);
    return { upcomingMeetings, dueTasks, overdueTasks };
  }

  private recipients(creatorId: string, assigneeIds: string[]) {
    return [...new Set([creatorId, ...assigneeIds])];
  }
}
