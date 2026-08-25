import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { authUserInclude } from './auth-user';
import { ClientContext } from './auth-request';
import { AuthTokenService } from './auth-token.service';
import { ChangePasswordDto, LoginDto } from './dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: AuthTokenService,
    private readonly audit: AuditService,
  ) {}

  async login(input: LoginDto, context: ClientContext) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: authUserInclude,
    });
    const passwordValid = user
      ? await this.passwords.verify(user.passwordHash, input.password)
      : false;

    if (!user || !passwordValid || !user.isActive) {
      await this.audit.record({
        action: 'identity.login_failed',
        entityType: 'User',
        entityId: user?.id,
        userId: user?.id,
        ipAddress: context.ipAddress,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const auth = await this.tokens.issue(user, context);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      action: 'identity.login_succeeded',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      ipAddress: context.ipAddress,
    });
    return auth;
  }

  refresh(refreshToken: string, context: ClientContext) {
    return this.tokens.rotate(refreshToken, context);
  }

  async logout(userId: string, familyId: string, ipAddress?: string) {
    await this.tokens.revokeFamily(familyId);
    await this.audit.record({
      action: 'identity.logout',
      entityType: 'User',
      entityId: userId,
      userId,
      ipAddress,
    });
  }

  async logoutAll(userId: string, ipAddress?: string) {
    await this.tokens.revokeAll(userId);
    await this.audit.record({
      action: 'identity.logout_all',
      entityType: 'User',
      entityId: userId,
      userId,
      ipAddress,
    });
  }

  async changePassword(
    userId: string,
    input: ChangePasswordDto,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (
      !(await this.passwords.verify(user.passwordHash, input.currentPassword))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException('New password must be different');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await this.passwords.hash(input.newPassword),
        passwordChangedAt: new Date(),
      },
    });
    await this.tokens.revokeAll(userId);
    await this.audit.record({
      action: 'identity.password_changed',
      entityType: 'User',
      entityId: userId,
      userId,
      ipAddress,
    });
  }
}
