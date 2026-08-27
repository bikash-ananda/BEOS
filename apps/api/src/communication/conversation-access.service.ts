import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/communication.dto';

@Injectable()
export class ConversationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  visibilityWhere(user: AuthenticatedUser): Prisma.ConversationWhereInput {
    return {
      OR: [
        { type: ConversationType.COMPANY },
        ...(user.department
          ? [
              {
                type: ConversationType.DEPARTMENT,
                departmentId: user.department.id,
              },
            ]
          : []),
        { members: { some: { userId: user.id } } },
      ],
    };
  }

  async assertAccess(user: AuthenticatedUser, id: string) {
    const count = await this.prisma.conversation.count({
      where: { id, AND: [this.visibilityWhere(user)] },
    });
    if (count !== 1) throw new NotFoundException('Conversation not found');
  }

  async prepare(user: AuthenticatedUser, input: CreateConversationDto) {
    const manager = user.permissions.includes('communication.manage');
    if (input.type === ConversationType.COMPANY) {
      if (!manager || user.branch)
        throw new ForbiddenException(
          'Company conversations require company-wide management access',
        );
      return {
        name: input.name?.trim() || 'Company',
        departmentId: null,
        memberIds: [],
      };
    }
    if (input.type === ConversationType.DEPARTMENT) {
      const departmentId =
        manager && !user.branch ? input.departmentId : user.department?.id;
      if (!departmentId)
        throw new BadRequestException('A department is required');
      const department = await this.prisma.department.findFirst({
        where: { id: departmentId, isActive: true },
        select: { name: true },
      });
      if (!department)
        throw new BadRequestException('Department is unavailable');
      return {
        name: input.name?.trim() || department.name,
        departmentId,
        memberIds: [],
      };
    }
    const memberIds = [...new Set([user.id, ...(input.memberIds ?? [])])];
    if (input.type === ConversationType.DIRECT && memberIds.length !== 2) {
      throw new BadRequestException(
        'Direct conversations require one other person',
      );
    }
    if (input.type === ConversationType.PRIVATE_GROUP && memberIds.length < 2) {
      throw new BadRequestException(
        'Private groups require at least two people',
      );
    }
    if (input.type === ConversationType.PRIVATE_GROUP && !input.name?.trim()) {
      throw new BadRequestException('Private groups require a name');
    }
    await this.assertActiveMembers(memberIds);
    if (input.type === ConversationType.DIRECT) {
      const candidates = await this.prisma.conversation.findMany({
        where: {
          type: ConversationType.DIRECT,
          members: { some: { userId: user.id } },
        },
        select: { id: true, members: { select: { userId: true } } },
      });
      const existing = candidates.find(
        (candidate) =>
          candidate.members.length === 2 &&
          candidate.members.every(({ userId }) => memberIds.includes(userId)),
      );
      if (existing)
        return {
          name: null,
          departmentId: null,
          memberIds,
          existingId: existing.id,
        };
    }
    return {
      name: input.type === ConversationType.DIRECT ? null : input.name!.trim(),
      departmentId: null,
      memberIds,
    };
  }

  async recipientIds(conversationId: string) {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      select: {
        type: true,
        departmentId: true,
        members: { select: { userId: true } },
      },
    });
    if (
      conversation.type === ConversationType.PRIVATE_GROUP ||
      conversation.type === ConversationType.DIRECT
    ) {
      return conversation.members.map(({ userId }) => userId);
    }
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(conversation.type === ConversationType.DEPARTMENT && {
          departmentId: conversation.departmentId,
        }),
        roles: {
          some: {
            role: {
              permissions: {
                some: { permission: { key: 'communication.read' } },
              },
            },
          },
        },
      },
      select: { id: true },
    });
    return users.map(({ id }) => id);
  }

  private async assertActiveMembers(userIds: string[]) {
    const count = await this.prisma.user.count({
      where: {
        id: { in: userIds },
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
      },
    });
    if (count !== userIds.length)
      throw new BadRequestException('One or more people are unavailable');
  }
}
