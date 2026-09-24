import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
}

type AuditWriter = Pick<Prisma.TransactionClient, 'auditLog'>;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    event: AuditEvent,
    writer: AuditWriter = this.prisma,
  ): Promise<void> {
    await writer.auditLog.create({ data: event });
  }

  async list(query: ListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.AuditLogWhereInput = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { entityType: { contains: search, mode: 'insensitive' } },
            { entityId: { contains: search, mode: 'insensitive' } },
            { user: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }
}
