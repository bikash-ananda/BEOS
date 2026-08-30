import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBranchDto,
  CreateDepartmentDto,
  UpdateBranchDto,
  UpdateDepartmentDto,
} from './dto/administration.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listBranches() {
    return this.prisma.branch.findMany({
      include: { _count: { select: { departments: true, users: true } } },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  listDepartments() {
    return this.prisma.department.findMany({
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { users: true } },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createBranch(input: CreateBranchDto, actorId: string, ip?: string) {
    try {
      const branch = await this.prisma.branch.create({
        data: {
          name: input.name.trim(),
          code: input.code.trim().toUpperCase(),
          city: input.city?.trim() || null,
        },
      });
      await this.record('branch_created', 'Branch', branch.id, actorId, ip);
      return branch;
    } catch (error) {
      this.rethrowUnique(error, 'A branch with this code already exists');
    }
  }

  async updateBranch(
    id: string,
    input: UpdateBranchDto,
    actorId: string,
    ip?: string,
  ) {
    await this.requireBranch(id);
    if (input.isActive === false) {
      const assigned = await this.prisma.branch.findUniqueOrThrow({
        where: { id },
        select: {
          _count: {
            select: {
              users: { where: { isActive: true } },
              departments: { where: { isActive: true } },
            },
          },
        },
      });
      if (assigned._count.users || assigned._count.departments) {
        throw new BadRequestException(
          'Reassign active users and disable departments first',
        );
      }
    }
    try {
      const branch = await this.prisma.branch.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name.trim() }),
          ...(input.code !== undefined && {
            code: input.code.trim().toUpperCase(),
          }),
          ...(input.city !== undefined && { city: input.city.trim() || null }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });
      await this.record('branch_updated', 'Branch', id, actorId, ip);
      return branch;
    } catch (error) {
      this.rethrowUnique(error, 'A branch with this code already exists');
    }
  }

  async createDepartment(
    input: CreateDepartmentDto,
    actorId: string,
    ip?: string,
  ) {
    await this.requireActiveBranch(input.branchId);
    try {
      const department = await this.prisma.department.create({
        data: {
          name: input.name.trim(),
          code: input.code.trim().toUpperCase(),
          branchId: input.branchId,
        },
      });
      await this.record(
        'department_created',
        'Department',
        department.id,
        actorId,
        ip,
      );
      return department;
    } catch (error) {
      this.rethrowUnique(
        error,
        'A department with this code already exists in the branch',
      );
    }
  }

  async updateDepartment(
    id: string,
    input: UpdateDepartmentDto,
    actorId: string,
    ip?: string,
  ) {
    const current = await this.prisma.department.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Department not found');
    if (input.isActive === false || input.branchId !== undefined) {
      const activeUsers = await this.prisma.user.count({
        where: { departmentId: id, isActive: true },
      });
      if (activeUsers) {
        throw new BadRequestException('Reassign active users first');
      }
    }
    const branchId = input.branchId ?? current.branchId;
    if (input.branchId || input.isActive === true) {
      await this.requireActiveBranch(branchId);
    }
    try {
      const department = await this.prisma.department.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name.trim() }),
          ...(input.code !== undefined && {
            code: input.code.trim().toUpperCase(),
          }),
          ...(input.branchId !== undefined && { branchId: input.branchId }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });
      await this.record('department_updated', 'Department', id, actorId, ip);
      return department;
    } catch (error) {
      this.rethrowUnique(
        error,
        'A department with this code already exists in the branch',
      );
    }
  }

  private async requireBranch(id: string) {
    if (!(await this.prisma.branch.findUnique({ where: { id } }))) {
      throw new NotFoundException('Branch not found');
    }
  }

  private async requireActiveBranch(id: string) {
    if (
      !(await this.prisma.branch.findFirst({ where: { id, isActive: true } }))
    ) {
      throw new BadRequestException('Active branch not found');
    }
  }

  private record(
    action: string,
    entityType: string,
    entityId: string,
    userId: string,
    ipAddress?: string,
  ) {
    return this.audit.record({
      action: `identity.${action}`,
      entityType,
      entityId,
      userId,
      ipAddress,
    });
  }

  private rethrowUnique(error: unknown, message: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }
    throw error;
  }
}
