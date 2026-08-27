import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth-user';
import { WorkspaceEventsService } from '../live/workspace-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAgendaItemDto,
  CreateDecisionDto,
  CreateMeetingDto,
  CreateMeetingNoteDto,
  LinkFileDto,
  RsvpDto,
  UpdateMeetingDto,
  WorkListQueryDto,
} from './dto/work.dto';
import { WorkAccessService } from './work-access.service';

const person = { select: { id: true, fullName: true } } as const;
const meetingInclude = {
  organizer: person,
  participants: {
    include: { user: person },
    orderBy: { user: { fullName: 'asc' as const } },
  },
  agendaItems: {
    include: {
      notes: {
        include: { author: person },
        orderBy: { createdAt: 'asc' as const },
      },
      decisions: {
        include: { author: person },
        orderBy: { createdAt: 'asc' as const },
      },
      tasks: {
        include: { assignees: { include: { user: person } } },
        orderBy: { createdAt: 'asc' as const },
      },
    },
    orderBy: { position: 'asc' as const },
  },
  notes: {
    where: { agendaItemId: null },
    include: { author: person },
    orderBy: { createdAt: 'asc' as const },
  },
  decisions: {
    where: { agendaItemId: null },
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
} satisfies Prisma.MeetingInclude;

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkAccessService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly events: WorkspaceEventsService,
  ) {}

  async list(user: AuthenticatedUser, query: WorkListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.MeetingWhereInput = {
      AND: [
        this.access.meetingWhere(user),
        ...(query.from || query.to
          ? [
              {
                startsAt: {
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
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.meeting.findMany({
        where,
        include: {
          organizer: person,
          participants: { include: { user: person } },
          _count: { select: { agendaItems: true, tasks: true } },
        },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.meeting.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async get(user: AuthenticatedUser, id: string) {
    await this.access.assertMeeting(user, id);
    return this.prisma.meeting.findUniqueOrThrow({
      where: { id },
      include: meetingInclude,
    });
  }

  async create(
    user: AuthenticatedUser,
    input: CreateMeetingDto,
    ipAddress?: string,
  ) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt)
      throw new BadRequestException('Meeting end must be after its start');
    const participantIds = await this.access.activeUserIds(user, [
      user.id,
      ...input.participantIds,
    ]);
    const created = await this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim(),
          location: input.location?.trim(),
          startsAt,
          endsAt,
          organizerId: user.id,
          participants: {
            createMany: {
              data: participantIds.map((userId) => ({
                userId,
                ...(userId === user.id && {
                  rsvp: 'ACCEPTED' as const,
                  respondedAt: new Date(),
                }),
              })),
            },
          },
        },
        select: { id: true, title: true },
      });
      for (const userId of participantIds.filter((id) => id !== user.id)) {
        await this.notifications.create(
          {
            userId,
            type: 'WORKSPACE',
            title: meeting.title,
            message: 'You were invited to a meeting.',
            href: `/work?meeting=${meeting.id}`,
            dedupeKey: `meeting:${meeting.id}:${userId}`,
          },
          tx,
        );
      }
      await this.audit.record(
        {
          action: 'work.meeting_created',
          entityType: 'Meeting',
          entityId: meeting.id,
          userId: user.id,
          ipAddress,
          metadata: { participants: participantIds.length },
        },
        tx,
      );
      return meeting;
    });
    this.events.emitToUsers(participantIds, {
      resource: 'meeting',
      action: 'created',
      id: created.id,
      meetingId: created.id,
    });
    return this.get(user, created.id);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateMeetingDto,
    ipAddress?: string,
  ) {
    const current = await this.access.assertMeetingManager(user, id);
    const participantIds = input.participantIds
      ? await this.access.activeUserIds(user, [
          current.organizerId,
          ...input.participantIds,
        ])
      : current.participants.map(({ userId }) => userId);
    const startsAt = input.startsAt ? new Date(input.startsAt) : undefined;
    const endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
    if ((endsAt ?? current.endsAt) <= (startsAt ?? current.startsAt)) {
      throw new BadRequestException('Meeting end must be after its start');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.meeting.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.description !== undefined && {
            description: input.description.trim() || null,
          }),
          ...(input.location !== undefined && {
            location: input.location.trim() || null,
          }),
          ...(startsAt && { startsAt }),
          ...(endsAt && { endsAt }),
          ...(input.status && { status: input.status }),
          ...(input.participantIds && {
            participants: {
              deleteMany: {},
              createMany: {
                data: participantIds.map((userId) => ({
                  userId,
                  ...(userId === current.organizerId && {
                    rsvp: 'ACCEPTED' as const,
                    respondedAt: new Date(),
                  }),
                })),
              },
            },
          }),
        },
      });
      await this.audit.record(
        {
          action: 'work.meeting_updated',
          entityType: 'Meeting',
          entityId: id,
          userId: user.id,
          ipAddress,
          metadata: input.status ? { status: input.status } : undefined,
        },
        tx,
      );
    });
    this.events.emitToUsers(participantIds, {
      resource: 'meeting',
      action: 'updated',
      id,
      meetingId: id,
    });
    return this.get(user, id);
  }

  async rsvp(user: AuthenticatedUser, id: string, input: RsvpDto) {
    await this.access.assertMeeting(user, id);
    const updated = await this.prisma.meetingParticipant.update({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
      data: { rsvp: input.rsvp, respondedAt: new Date() },
    });
    const recipients = await this.recipientIds(id);
    this.events.emitToUsers(recipients, {
      resource: 'meeting',
      action: 'updated',
      id,
      meetingId: id,
    });
    return updated;
  }

  async addAgenda(
    user: AuthenticatedUser,
    id: string,
    input: CreateAgendaItemDto,
  ) {
    await this.access.assertMeetingManager(user, id);
    const position =
      input.position ??
      ((
        await this.prisma.meetingAgendaItem.aggregate({
          where: { meetingId: id },
          _max: { position: true },
        })
      )._max.position ?? 0) + 1;
    const item = await this.prisma.meetingAgendaItem.create({
      data: {
        meetingId: id,
        title: input.title.trim(),
        details: input.details?.trim(),
        position,
        createdById: user.id,
      },
    });
    this.events.emitToUsers(await this.recipientIds(id), {
      resource: 'meeting',
      action: 'updated',
      id,
      meetingId: id,
    });
    return item;
  }

  async addNote(
    user: AuthenticatedUser,
    id: string,
    input: CreateMeetingNoteDto,
  ) {
    await this.access.assertMeeting(user, id);
    await this.assertAgenda(id, input.agendaItemId);
    const note = await this.prisma.meetingNote.create({
      data: {
        meetingId: id,
        agendaItemId: input.agendaItemId,
        authorId: user.id,
        kind: input.kind,
        body: input.body.trim(),
      },
      include: { author: person },
    });
    this.events.emitToUsers(await this.recipientIds(id), {
      resource: 'meeting',
      action: 'updated',
      id,
      meetingId: id,
    });
    return note;
  }

  async addDecision(
    user: AuthenticatedUser,
    id: string,
    input: CreateDecisionDto,
    ipAddress?: string,
  ) {
    await this.access.assertMeetingManager(user, id);
    await this.assertAgenda(id, input.agendaItemId);
    const decision = await this.prisma.$transaction(async (tx) => {
      const created = await tx.meetingDecision.create({
        data: {
          meetingId: id,
          agendaItemId: input.agendaItemId,
          authorId: user.id,
          body: input.body.trim(),
        },
        include: { author: person },
      });
      await this.audit.record(
        {
          action: 'work.decision_recorded',
          entityType: 'MeetingDecision',
          entityId: created.id,
          userId: user.id,
          ipAddress,
          metadata: { meetingId: id },
        },
        tx,
      );
      return created;
    });
    this.events.emitToUsers(await this.recipientIds(id), {
      resource: 'meeting',
      action: 'updated',
      id,
      meetingId: id,
    });
    return decision;
  }

  async linkFile(user: AuthenticatedUser, id: string, input: LinkFileDto) {
    await this.access.assertMeetingManager(user, id);
    await this.access.assertVisibleFile(user, input.fileId);
    const result = await this.prisma.meetingAttachment.upsert({
      where: { meetingId_fileId: { meetingId: id, fileId: input.fileId } },
      create: { meetingId: id, fileId: input.fileId },
      update: {},
      include: { file: true },
    });
    this.events.emitToUsers(await this.recipientIds(id), {
      resource: 'meeting',
      action: 'updated',
      id,
      meetingId: id,
    });
    return result;
  }

  async people(user: AuthenticatedUser, query: WorkListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      isActive: true,
      ...(user.branch && { branchId: user.branch.id }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          branch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
        },
        orderBy: { fullName: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  private async recipientIds(meetingId: string) {
    return (
      await this.prisma.meetingParticipant.findMany({
        where: { meetingId },
        select: { userId: true },
      })
    ).map(({ userId }) => userId);
  }

  private async assertAgenda(meetingId: string, agendaItemId?: string) {
    if (!agendaItemId) return;
    if (
      (await this.prisma.meetingAgendaItem.count({
        where: { id: agendaItemId, meetingId },
      })) !== 1
    )
      throw new BadRequestException('Agenda item is unavailable');
  }
}
