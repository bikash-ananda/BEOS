import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunicationListQueryDto,
  CreateConversationDto,
  CreateMessageDto,
  MessageListQueryDto,
} from './dto/communication.dto';
import { WorkspaceEventsService } from '../live/workspace-events.service';
import { ConversationAccessService } from './conversation-access.service';

const memberSelect = {
  user: {
    select: {
      id: true,
      fullName: true,
      branch: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  },
} satisfies Prisma.ConversationMemberSelect;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: WorkspaceEventsService,
    private readonly access: ConversationAccessService,
  ) {}

  async list(user: AuthenticatedUser, query: CommunicationListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.ConversationWhereInput = {
      AND: [
        this.access.visibilityWhere(user),
        ...(search
          ? [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }]
          : []),
      ],
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          members: { select: memberSelect },
          messages: {
            where: { deletedAt: null },
            select: {
              id: true,
              body: true,
              createdAt: true,
              author: { select: { id: true, fullName: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 1,
          },
          receipts: { where: { userId: user.id }, select: { readAt: true } },
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);
    const presented = await Promise.all(
      items.map(async ({ receipts, ...item }) => {
        const readAt = receipts[0]?.readAt;
        const unread = await this.prisma.conversationMessage.count({
          where: {
            conversationId: item.id,
            deletedAt: null,
            authorId: { not: user.id },
            ...(readAt && { createdAt: { gt: readAt } }),
          },
        });
        return { ...item, readAt: readAt ?? null, unread };
      }),
    );
    return {
      items: presented,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async listPeople(query: CommunicationListQueryDto) {
    const search = query.search?.trim();
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
        orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async create(
    user: AuthenticatedUser,
    input: CreateConversationDto,
    ipAddress?: string,
  ) {
    const prepared = await this.access.prepare(user, input);
    if (prepared.existingId) {
      return this.get(user, prepared.existingId);
    }
    const conversation = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.conversation.create({
        data: {
          type: input.type,
          name: prepared.name,
          departmentId: prepared.departmentId,
          createdById: user.id,
          ...(prepared.memberIds.length > 0
            ? {
                members: {
                  createMany: {
                    data: prepared.memberIds.map((userId: string) => ({
                      userId,
                    })),
                  },
                },
              }
            : {}),
        },
        select: { id: true },
      });
      await this.audit.record(
        {
          action: 'communication.conversation_created',
          entityType: 'Conversation',
          entityId: created.id,
          userId: user.id,
          ipAddress,
          metadata: { type: input.type },
        },
        transaction,
      );
      return created;
    });
    const recipients = await this.access.recipientIds(conversation.id);
    this.events.emitToUsers(recipients, {
      resource: 'conversation',
      action: 'created',
      id: conversation.id,
      conversationId: conversation.id,
    });
    return this.get(user, conversation.id);
  }

  async get(user: AuthenticatedUser, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, AND: [this.access.visibilityWhere(user)] },
      include: {
        department: { select: { id: true, name: true, code: true } },
        members: { select: memberSelect },
        receipts: {
          select: {
            readAt: true,
            user: { select: { id: true, fullName: true } },
          },
          orderBy: { readAt: 'desc' },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async listMessages(
    user: AuthenticatedUser,
    conversationId: string,
    query: MessageListQueryDto,
  ) {
    await this.access.assertAccess(user, conversationId);
    const where = { conversationId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.conversationMessage.findMany({
        where,
        include: { author: { select: { id: true, fullName: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.conversationMessage.count({ where }),
    ]);
    return {
      items: items.reverse(),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async sendMessage(
    user: AuthenticatedUser,
    conversationId: string,
    input: CreateMessageDto,
  ) {
    await this.access.assertAccess(user, conversationId);
    const message = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.conversationMessage.create({
        data: {
          conversationId,
          authorId: user.id,
          body: input.body.trim(),
        },
        include: { author: { select: { id: true, fullName: true } } },
      });
      await transaction.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      await transaction.conversationReadReceipt.upsert({
        where: { conversationId_userId: { conversationId, userId: user.id } },
        create: { conversationId, userId: user.id },
        update: { readAt: new Date() },
      });
      return created;
    });
    this.events.emitToUsers(await this.access.recipientIds(conversationId), {
      resource: 'message',
      action: 'created',
      id: message.id,
      conversationId,
    });
    return message;
  }

  async updateMessage(
    user: AuthenticatedUser,
    id: string,
    input: CreateMessageDto,
  ) {
    const current = await this.findMessage(user, id);
    this.assertOwnerOrManager(user, current.authorId);
    const message = await this.prisma.conversationMessage.update({
      where: { id },
      data: { body: input.body.trim(), editedAt: new Date() },
      include: { author: { select: { id: true, fullName: true } } },
    });
    this.events.emitToUsers(
      await this.access.recipientIds(current.conversationId),
      {
        resource: 'message',
        action: 'updated',
        id,
        conversationId: current.conversationId,
      },
    );
    return message;
  }

  async removeMessage(user: AuthenticatedUser, id: string) {
    const current = await this.findMessage(user, id);
    this.assertOwnerOrManager(user, current.authorId);
    await this.prisma.conversationMessage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.events.emitToUsers(
      await this.access.recipientIds(current.conversationId),
      {
        resource: 'message',
        action: 'deleted',
        id,
        conversationId: current.conversationId,
      },
    );
    return { id };
  }

  async markRead(user: AuthenticatedUser, conversationId: string) {
    await this.access.assertAccess(user, conversationId);
    const receipt = await this.prisma.conversationReadReceipt.upsert({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      create: { conversationId, userId: user.id },
      update: { readAt: new Date() },
    });
    this.events.emitToUsers(await this.access.recipientIds(conversationId), {
      resource: 'conversation',
      action: 'read',
      id: conversationId,
      conversationId,
    });
    return receipt;
  }

  private async findMessage(user: AuthenticatedUser, id: string) {
    const message = await this.prisma.conversationMessage.findFirst({
      where: {
        id,
        deletedAt: null,
        conversation: this.access.visibilityWhere(user),
      },
      select: { id: true, authorId: true, conversationId: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  private assertOwnerOrManager(user: AuthenticatedUser, ownerId: string) {
    if (
      user.id !== ownerId &&
      !user.permissions.includes('communication.manage')
    ) {
      throw new ForbiddenException('You cannot change this message');
    }
  }
}
