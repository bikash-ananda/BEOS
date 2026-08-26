import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationInput {
  userId: string;
  type: 'ACCOUNT' | 'SECURITY' | 'WORKSPACE';
  title: string;
  message: string;
  href?: string;
  dedupeKey?: string;
}

type NotificationWriter = Pick<Prisma.TransactionClient, 'notification'>;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, total, unread, page: query.page, limit: query.limit };
  }

  async unreadCount(userId: string) {
    return {
      count: await this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (result.count !== 1)
      throw new NotFoundException('Notification not found');
    return this.prisma.notification.findUniqueOrThrow({ where: { id } });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async create(
    input: CreateNotificationInput,
    writer: NotificationWriter = this.prisma,
  ) {
    const data = {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
      dedupeKey: input.dedupeKey,
    };
    return input.dedupeKey
      ? writer.notification.upsert({
          where: { dedupeKey: input.dedupeKey },
          create: data,
          update: {},
        })
      : writer.notification.create({ data });
  }
}
