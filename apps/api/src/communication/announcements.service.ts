import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnnouncementTarget, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceEventsService } from '../live/workspace-events.service';
import {
  CommunicationListQueryDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/communication.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly events: WorkspaceEventsService,
  ) {}

  async list(user: AuthenticatedUser, query: CommunicationListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.AnnouncementWhereInput = {
      deletedAt: null,
      recipients: { some: { userId: user.id } },
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        include: {
          author: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          recipients: {
            where: { userId: user.id },
            select: { readAt: true },
          },
          _count: { select: { recipients: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return {
      items: items.map(({ recipients, ...item }) => ({
        ...item,
        readAt: recipients[0]?.readAt ?? null,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async create(
    user: AuthenticatedUser,
    input: CreateAnnouncementDto,
    ipAddress?: string,
  ) {
    const recipientIds = await this.resolveRecipients(user, input);
    if (!recipientIds.length)
      throw new BadRequestException(
        'The selected audience has no active users',
      );
    const announcement = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.announcement.create({
        data: {
          title: input.title.trim(),
          body: input.body.trim(),
          target: input.target,
          branchId:
            input.target === AnnouncementTarget.BRANCH ? input.branchId : null,
          departmentId:
            input.target === AnnouncementTarget.DEPARTMENT
              ? input.departmentId
              : null,
          authorId: user.id,
          recipients: {
            createMany: {
              data: recipientIds.map((userId) => ({ userId })),
            },
          },
        },
        include: {
          author: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          _count: { select: { recipients: true } },
        },
      });
      for (const userId of recipientIds) {
        await this.notifications.create(
          {
            userId,
            type: 'WORKSPACE',
            title: created.title,
            message: 'A new company announcement is available.',
            href: '/communication?view=announcements',
            dedupeKey: `announcement:${created.id}:${userId}`,
          },
          transaction,
        );
      }
      await this.audit.record(
        {
          action: 'communication.announcement_published',
          entityType: 'Announcement',
          entityId: created.id,
          userId: user.id,
          ipAddress,
          metadata: { target: input.target, recipients: recipientIds.length },
        },
        transaction,
      );
      return created;
    });
    this.events.emitToUsers(recipientIds, {
      resource: 'announcement',
      action: 'created',
      id: announcement.id,
    });
    return { ...announcement, readAt: null };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateAnnouncementDto,
    ipAddress?: string,
  ) {
    const recipientIds = await this.findRecipientIds(id);
    const announcement = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.announcement.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.body !== undefined && { body: input.body.trim() }),
          editedAt: new Date(),
        },
        include: {
          author: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          _count: { select: { recipients: true } },
        },
      });
      await this.audit.record(
        {
          action: 'communication.announcement_updated',
          entityType: 'Announcement',
          entityId: id,
          userId: user.id,
          ipAddress,
        },
        transaction,
      );
      return updated;
    });
    this.events.emitToUsers(recipientIds, {
      resource: 'announcement',
      action: 'updated',
      id,
    });
    return announcement;
  }

  async remove(user: AuthenticatedUser, id: string, ipAddress?: string) {
    const recipientIds = await this.findRecipientIds(id);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.announcement.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.audit.record(
        {
          action: 'communication.announcement_deleted',
          entityType: 'Announcement',
          entityId: id,
          userId: user.id,
          ipAddress,
        },
        transaction,
      );
    });
    this.events.emitToUsers(recipientIds, {
      resource: 'announcement',
      action: 'deleted',
      id,
    });
    return { id };
  }

  async markRead(user: AuthenticatedUser, id: string) {
    const result = await this.prisma.announcementRecipient.updateMany({
      where: {
        announcementId: id,
        userId: user.id,
        announcement: { deletedAt: null },
      },
      data: { readAt: new Date() },
    });
    if (result.count !== 1)
      throw new NotFoundException('Announcement not found');
    this.events.emitToUsers([user.id], {
      resource: 'announcement',
      action: 'read',
      id,
    });
    return this.prisma.announcementRecipient.findUniqueOrThrow({
      where: { announcementId_userId: { announcementId: id, userId: user.id } },
    });
  }

  private async resolveRecipients(
    user: AuthenticatedUser,
    input: CreateAnnouncementDto,
  ) {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      roles: {
        some: {
          role: {
            permissions: {
              some: { permission: { key: 'communication.read' } },
            },
          },
        },
      },
    };
    if (input.target === AnnouncementTarget.COMPANY && user.branch) {
      throw new BadRequestException(
        'Company announcements require company-wide access',
      );
    }
    if (input.target === AnnouncementTarget.BRANCH) {
      if (!input.branchId)
        throw new BadRequestException('A branch is required');
      if (user.branch && input.branchId !== user.branch.id)
        throw new BadRequestException('Use your assigned branch');
      where.branchId = input.branchId;
    } else if (input.target === AnnouncementTarget.DEPARTMENT) {
      if (!input.departmentId)
        throw new BadRequestException('A department is required');
      if (user.branch && input.departmentId !== user.department?.id)
        throw new BadRequestException('Use your assigned department');
      where.departmentId = input.departmentId;
    } else if (input.target === AnnouncementTarget.USERS) {
      if (!input.userIds?.length)
        throw new BadRequestException('Choose at least one person');
      where.id = { in: input.userIds };
      if (user.department) where.departmentId = user.department.id;
      else if (user.branch) where.branchId = user.branch.id;
    }
    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });
    if (
      input.target === AnnouncementTarget.USERS &&
      users.length !== new Set(input.userIds).size
    ) {
      throw new BadRequestException('One or more people are unavailable');
    }
    return users.map(({ id }) => id);
  }

  private async findRecipientIds(id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, deletedAt: null },
      select: { recipients: { select: { userId: true } } },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement.recipients.map(({ userId }) => userId);
  }
}
