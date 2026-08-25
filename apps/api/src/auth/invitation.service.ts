import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { Environment } from '../config/environment';
import { PrismaService } from '../prisma/prisma.service';
import { authUserInclude } from './auth-user';
import { ClientContext } from './auth-request';
import { AuthTokenService } from './auth-token.service';
import { AcceptInvitationDto, CreateInvitationDto } from './dto';
import { PasswordService } from './password.service';
import {
  createTokenSecret,
  hashTokenSecret,
  parseOpaqueToken,
  serializeOpaqueToken,
  tokenSecretMatches,
} from './token-crypto';

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Environment, true>,
    private readonly passwords: PasswordService,
    private readonly tokens: AuthTokenService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const invitations = await this.prisma.invitation.findMany({
      select: {
        id: true,
        email: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        invitedBy: { select: { id: true, fullName: true } },
        roles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const now = Date.now();
    return invitations.map((invitation) => ({
      ...invitation,
      roles: invitation.roles.map(({ role }) => role),
      status: invitation.acceptedAt
        ? 'accepted'
        : invitation.revokedAt
          ? 'revoked'
          : invitation.expiresAt.getTime() <= now
            ? 'expired'
            : 'pending',
    }));
  }

  async create(
    input: CreateInvitationDto,
    invitedById: string,
    context: ClientContext,
  ) {
    const email = input.email.trim().toLowerCase();
    const roleIds = [...new Set(input.roleIds)];
    await this.validateAssignment(
      email,
      roleIds,
      invitedById,
      input.branchId,
      input.departmentId,
    );

    const secret = createTokenSecret();
    const expiresAt = new Date(
      Date.now() +
        this.config.get('AUTH_INVITE_TTL_HOURS', { infer: true }) *
          60 *
          60 *
          1_000,
    );

    await this.prisma.invitation.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const invitation = await this.prisma.invitation.create({
      data: {
        email,
        tokenHash: hashTokenSecret(secret),
        branchId: input.branchId,
        departmentId: input.departmentId,
        invitedById,
        expiresAt,
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      select: { id: true, email: true, expiresAt: true },
    });
    await this.audit.record({
      action: 'identity.invitation_created',
      entityType: 'Invitation',
      entityId: invitation.id,
      userId: invitedById,
      ipAddress: context.ipAddress,
      metadata: { email },
    });

    return {
      ...invitation,
      token: serializeOpaqueToken(invitation.id, secret),
    };
  }

  async revoke(id: string, userId: string, ipAddress?: string) {
    const result = await this.prisma.invitation.updateMany({
      where: { id, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count !== 1) {
      throw new BadRequestException('Invitation is already inactive');
    }

    await this.audit.record({
      action: 'identity.invitation_revoked',
      entityType: 'Invitation',
      entityId: id,
      userId,
      ipAddress,
    });
  }

  async accept(input: AcceptInvitationDto, context: ClientContext) {
    const token = parseOpaqueToken(input.token);
    if (!token) throw this.invalidInvitation();

    const invitation = await this.prisma.invitation.findUnique({
      where: { id: token.id },
      include: { roles: true },
    });
    if (
      !invitation ||
      !tokenSecretMatches(token.secret, invitation.tokenHash) ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt.getTime() <= Date.now()
    ) {
      throw this.invalidInvitation();
    }
    if (
      await this.prisma.user.findUnique({ where: { email: invitation.email } })
    ) {
      throw new ConflictException('An account already exists for this email');
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.invitation.updateMany({
        where: {
          id: invitation.id,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { acceptedAt: new Date() },
      });
      if (consumed.count !== 1) throw this.invalidInvitation();

      return transaction.user.create({
        data: {
          email: invitation.email,
          fullName: input.fullName.trim(),
          passwordHash,
          branchId: invitation.branchId,
          departmentId: invitation.departmentId,
          roles: {
            create: invitation.roles.map(({ roleId }) => ({ roleId })),
          },
        },
        include: authUserInclude,
      });
    });
    const auth = await this.tokens.issue(user, context);
    await this.audit.record({
      action: 'identity.invitation_accepted',
      entityType: 'Invitation',
      entityId: invitation.id,
      userId: user.id,
      ipAddress: context.ipAddress,
    });
    return auth;
  }

  private async validateAssignment(
    email: string,
    roleIds: string[],
    invitedById: string,
    branchId?: string,
    departmentId?: string,
  ): Promise<void> {
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account already exists for this email');
    }
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { name: true },
    });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more roles do not exist');
    }
    if (roles.some(({ name }) => ['Super Admin', 'Director'].includes(name))) {
      const inviterIsSuperAdmin = await this.prisma.userRole.findFirst({
        where: { userId: invitedById, role: { name: 'Super Admin' } },
      });
      if (!inviterIsSuperAdmin) {
        throw new ForbiddenException('Only a Super Admin can assign this role');
      }
    }
    if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, isActive: true },
      });
      if (!branch) throw new BadRequestException('Branch does not exist');
    }
    if (departmentId) {
      if (!branchId) {
        throw new BadRequestException(
          'A branch is required when assigning a department',
        );
      }
      const department = await this.prisma.department.findFirst({
        where: {
          id: departmentId,
          isActive: true,
          branchId,
        },
      });
      if (!department) {
        throw new BadRequestException(
          'Department does not exist in the selected branch',
        );
      }
    }
  }

  private invalidInvitation(): BadRequestException {
    return new BadRequestException('Invitation is invalid or expired');
  }
}
