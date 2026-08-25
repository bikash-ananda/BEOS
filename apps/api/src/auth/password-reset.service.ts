import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { Environment } from '../config/environment';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { CompletePasswordResetDto } from './dto';
import { PasswordService } from './password.service';
import {
  createTokenSecret,
  hashTokenSecret,
  parseOpaqueToken,
  serializeOpaqueToken,
  tokenSecretMatches,
} from './token-crypto';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Environment, true>,
    private readonly passwords: PasswordService,
    private readonly tokens: AuthTokenService,
    private readonly audit: AuditService,
  ) {}

  async create(emailInput: string, createdById: string, ipAddress?: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User was not found');
    if (
      user.roles.some(({ role }) =>
        ['Super Admin', 'Director'].includes(role.name),
      )
    ) {
      const creatorIsSuperAdmin = await this.prisma.userRole.findFirst({
        where: { userId: createdById, role: { name: 'Super Admin' } },
      });
      if (!creatorIsSuperAdmin) {
        throw new ForbiddenException(
          'Only a Super Admin can reset this account',
        );
      }
    }

    const secret = createTokenSecret();
    const expiresAt = new Date(
      Date.now() +
        this.config.get('AUTH_RESET_TTL_HOURS', { infer: true }) *
          60 *
          60 *
          1_000,
    );
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const reset = await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        createdById,
        tokenHash: hashTokenSecret(secret),
        expiresAt,
      },
      select: { id: true, expiresAt: true },
    });
    await this.audit.record({
      action: 'identity.password_reset_created',
      entityType: 'PasswordReset',
      entityId: reset.id,
      userId: createdById,
      ipAddress,
      metadata: { targetUserId: user.id },
    });

    return { ...reset, token: serializeOpaqueToken(reset.id, secret) };
  }

  async complete(input: CompletePasswordResetDto, ipAddress?: string) {
    const token = parseOpaqueToken(input.token);
    if (!token) throw this.invalidReset();

    const reset = await this.prisma.passwordReset.findUnique({
      where: { id: token.id },
    });
    if (
      !reset ||
      !tokenSecretMatches(token.secret, reset.tokenHash) ||
      reset.usedAt ||
      reset.revokedAt ||
      reset.expiresAt.getTime() <= Date.now()
    ) {
      throw this.invalidReset();
    }

    const passwordHash = await this.passwords.hash(input.password);
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordReset.updateMany({
        where: {
          id: reset.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw this.invalidReset();

      await transaction.user.update({
        where: { id: reset.userId },
        data: { passwordHash, passwordChangedAt: new Date(), isActive: true },
      });
      await transaction.authSession.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    await this.audit.record({
      action: 'identity.password_reset_completed',
      entityType: 'PasswordReset',
      entityId: reset.id,
      userId: reset.userId,
      ipAddress,
    });
  }

  private invalidReset(): BadRequestException {
    return new BadRequestException('Password reset is invalid or expired');
  }
}
