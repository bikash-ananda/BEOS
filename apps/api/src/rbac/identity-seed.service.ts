import { ConflictException, Injectable } from '@nestjs/common';
import argon2 from 'argon2-browser';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_PERMISSIONS, SYSTEM_ROLES } from './permissions';

export interface BootstrapAdminInput {
  email: string;
  fullName: string;
  password: string;
}

@Injectable()
export class IdentitySeedService {
  constructor(private readonly prisma: PrismaService) {}

  async seedRbac(): Promise<void> {
    for (const permission of SYSTEM_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: permission.key },
        create: permission,
        update: { description: permission.description },
      });
    }

    for (const definition of SYSTEM_ROLES) {
      const role = await this.prisma.role.upsert({
        where: { name: definition.name },
        create: { name: definition.name, description: definition.description },
        update: { description: definition.description },
      });
      const permissions = await this.prisma.permission.findMany({
        where: { key: { in: [...definition.permissions] } },
        select: { id: true },
      });

      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
        this.prisma.rolePermission.createMany({
          data: permissions.map(({ id }) => ({
            roleId: role.id,
            permissionId: id,
          })),
        }),
      ]);
    }
  }

  async bootstrapAdmin(input: BootstrapAdminInput) {
    await this.seedRbac();

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: 'Super Admin' },
    });
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    const email = input.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account already exists for this email');
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        passwordHash,
        roles: { create: { roleId: role.id } },
      },
      select: { id: true, email: true, fullName: true },
    });
    await this.prisma.auditLog.create({
      data: {
        action: 'identity.admin_bootstrapped',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
      },
    });

    return user;
  }
}
