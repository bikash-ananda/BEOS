import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkAccessService {
  constructor(private readonly prisma: PrismaService) {}

  meetingWhere(user: AuthenticatedUser): Prisma.MeetingWhereInput {
    return {
      OR: [
        { organizerId: user.id },
        { participants: { some: { userId: user.id } } },
      ],
    };
  }

  taskWhere(user: AuthenticatedUser): Prisma.WorkTaskWhereInput {
    return {
      OR: [
        { createdById: user.id },
        { assignees: { some: { userId: user.id } } },
        { meeting: this.meetingWhere(user) },
      ],
    };
  }

  async assertMeeting(user: AuthenticatedUser, id: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, AND: [this.meetingWhere(user)] },
      select: {
        id: true,
        organizerId: true,
        startsAt: true,
        endsAt: true,
        participants: { select: { userId: true } },
      },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async assertMeetingManager(user: AuthenticatedUser, id: string) {
    const meeting = await this.assertMeeting(user, id);
    if (
      meeting.organizerId !== user.id &&
      !user.permissions.includes('meetings.manage')
    ) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  async assertTask(user: AuthenticatedUser, id: string) {
    const task = await this.prisma.workTask.findFirst({
      where: { id, AND: [this.taskWhere(user)] },
      select: {
        id: true,
        createdById: true,
        assignees: { select: { userId: true } },
        meetingId: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async activeUserIds(user: AuthenticatedUser, ids: string[]) {
    const unique = [...new Set(ids)];
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: unique },
        isActive: true,
        ...(user.branch && { branchId: user.branch.id }),
      },
      select: { id: true },
    });
    if (users.length !== unique.length)
      throw new BadRequestException('One or more people are unavailable');
    return unique;
  }

  async assertVisibleFile(user: AuthenticatedUser, fileId: string) {
    const file = await this.prisma.fileRecord.findFirst({
      where: {
        id: fileId,
        workspaceAttachments: {
          some: {
            OR: [
              { scope: 'COMPANY' },
              ...(user.branch
                ? [{ scope: 'BRANCH' as const, branchId: user.branch.id }]
                : []),
              ...(user.department
                ? [
                    {
                      scope: 'DEPARTMENT' as const,
                      departmentId: user.department.id,
                    },
                  ]
                : []),
            ],
          },
        },
      },
      select: { id: true },
    });
    if (!file) throw new BadRequestException('File is unavailable');
  }
}
