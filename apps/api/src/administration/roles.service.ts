import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_ROLES } from '../rbac/permissions';
import { CreateRoleDto, UpdateRoleDto } from './dto/administration.dto';

const systemRoleNames = new Set(SYSTEM_ROLES.map(({ name }) => name));

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return roles.map((role) => ({
      ...role,
      isSystem: systemRoleNames.has(role.name),
      permissions: role.permissions.map(({ permission }) => permission),
    }));
  }

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  async create(input: CreateRoleDto, actorId: string, ip?: string) {
    const permissionIds = await this.validatePermissions(input.permissionIds);
    try {
      const role = await this.prisma.role.create({
        data: {
          name: input.name.trim(),
          description: input.description?.trim() || null,
          permissions: {
            create: permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
      });
      await this.record('role_created', role.id, actorId, ip);
      return role;
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(id: string, input: UpdateRoleDto, actorId: string, ip?: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (systemRoleNames.has(role.name)) {
      throw new ForbiddenException('System roles are managed by BEOS');
    }
    const permissionIds = input.permissionIds
      ? await this.validatePermissions(input.permissionIds)
      : undefined;
    try {
      const updated = await this.prisma.$transaction(async (transaction) => {
        const result = await transaction.role.update({
          where: { id },
          data: {
            ...(input.name !== undefined && { name: input.name.trim() }),
            ...(input.description !== undefined && {
              description: input.description.trim() || null,
            }),
          },
        });
        if (permissionIds) {
          await transaction.rolePermission.deleteMany({
            where: { roleId: id },
          });
          await transaction.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
        return result;
      });
      await this.record('role_updated', id, actorId, ip);
      return updated;
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  private async validatePermissions(ids: string[]) {
    const permissionIds = [...new Set(ids)];
    const count = await this.prisma.permission.count({
      where: { id: { in: permissionIds } },
    });
    if (count !== permissionIds.length) {
      throw new BadRequestException('One or more permissions do not exist');
    }
    return permissionIds;
  }

  private record(
    action: string,
    id: string,
    userId: string,
    ipAddress?: string,
  ) {
    return this.audit.record({
      action: `identity.${action}`,
      entityType: 'Role',
      entityId: id,
      userId,
      ipAddress,
    });
  }

  private rethrowUnique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A role with this name already exists');
    }
    throw error;
  }
}
