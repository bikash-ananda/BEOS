import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { UpdateUserDto } from './dto/administration.dto';

const privilegedRoles = ['Super Admin', 'Director'];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          branch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          roles: { include: { role: true } },
        },
        orderBy: { fullName: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map((user) => ({
        ...user,
        roles: user.roles.map(({ role }) => role),
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async update(
    id: string,
    input: UpdateUserDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('User not found');
    if (id === actor.id && input.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    const actorIsSuperAdmin = actor.roles.includes('Super Admin');
    const targetIsPrivileged = target.roles.some(({ role }) =>
      privilegedRoles.includes(role.name),
    );
    if (targetIsPrivileged && !actorIsSuperAdmin) {
      throw new ForbiddenException('Only a Super Admin can manage this user');
    }

    const roleIds = input.roleIds
      ? await this.validateRoles(input.roleIds, actorIsSuperAdmin)
      : undefined;
    await this.validateOrganization(
      input.branchId === undefined ? target.branchId : input.branchId,
      input.departmentId === undefined
        ? target.departmentId
        : input.departmentId,
    );

    try {
      const updated = await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.update({
          where: { id },
          data: {
            ...(input.fullName !== undefined && {
              fullName: input.fullName.trim(),
            }),
            ...(input.email !== undefined && {
              email: input.email.trim().toLowerCase(),
            }),
            ...(input.branchId !== undefined && { branchId: input.branchId }),
            ...(input.departmentId !== undefined && {
              departmentId: input.departmentId,
            }),
            ...(input.isActive !== undefined && { isActive: input.isActive }),
          },
          select: { id: true, email: true, fullName: true, isActive: true },
        });
        if (roleIds) {
          await transaction.userRole.deleteMany({ where: { userId: id } });
          await transaction.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId: id, roleId })),
          });
        }
        if (input.isActive === false) {
          await transaction.authSession.updateMany({
            where: { userId: id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
        return user;
      });
      await this.audit.record({
        action: 'identity.user_updated',
        entityType: 'User',
        entityId: id,
        userId: actor.id,
        ipAddress,
        metadata: { fields: Object.keys(input) },
      });
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account already exists for this email');
      }
      throw error;
    }
  }

  private async validateRoles(ids: string[], actorIsSuperAdmin: boolean) {
    const roleIds = [...new Set(ids)];
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles do not exist');
    }
    if (
      !actorIsSuperAdmin &&
      roles.some(({ name }) => privilegedRoles.includes(name))
    ) {
      throw new ForbiddenException('Only a Super Admin can assign this role');
    }
    return roleIds;
  }

  private async validateOrganization(
    branchId: string | null,
    departmentId: string | null,
  ) {
    if (departmentId && !branchId) {
      throw new BadRequestException('A branch is required for a department');
    }
    if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, isActive: true },
      });
      if (!branch) throw new BadRequestException('Active branch not found');
    }
    if (departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: departmentId, branchId: branchId!, isActive: true },
      });
      if (!department) {
        throw new BadRequestException('Active department not found in branch');
      }
    }
  }
}
