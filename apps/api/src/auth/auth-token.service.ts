import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Environment } from '../config/environment';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuthenticatedUser,
  AuthUserRecord,
  authUserInclude,
  toAuthenticatedUser,
} from './auth-user';
import { ClientContext } from './auth-request';
import {
  createTokenSecret,
  hashTokenSecret,
  parseOpaqueToken,
  serializeOpaqueToken,
  tokenSecretMatches,
} from './token-crypto';

const accessPayloadSchema = z.object({
  sub: z.string(),
  familyId: z.string(),
  type: z.literal('access'),
});

export interface IssuedAuth {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async issue(
    user: AuthUserRecord,
    context: ClientContext,
    familyId = randomUUID(),
  ): Promise<IssuedAuth> {
    const secret = createTokenSecret();
    const session = await this.prisma.authSession.create({
      data: {
        familyId,
        tokenHash: hashTokenSecret(secret),
        userId: user.id,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: this.refreshExpiry(),
      },
    });

    return {
      accessToken: await this.signAccess(user.id, familyId),
      refreshToken: serializeOpaqueToken(session.id, secret),
      user: toAuthenticatedUser(user, familyId),
    };
  }

  async rotate(rawToken: string, context: ClientContext): Promise<IssuedAuth> {
    const token = parseOpaqueToken(rawToken);
    if (!token) throw this.invalidSession();

    const current = await this.prisma.authSession.findUnique({
      where: { id: token.id },
    });
    if (!current || !tokenSecretMatches(token.secret, current.tokenHash)) {
      throw this.invalidSession();
    }

    if (
      current.usedAt ||
      current.revokedAt ||
      current.expiresAt.getTime() <= Date.now()
    ) {
      await this.revokeFamily(current.familyId);
      throw new UnauthorizedException('Refresh token replay detected');
    }

    const nextSecret = createTokenSecret();
    const next = await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.authSession.updateMany({
        where: {
          id: current.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) return null;

      return transaction.authSession.create({
        data: {
          familyId: current.familyId,
          tokenHash: hashTokenSecret(nextSecret),
          userId: current.userId,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          expiresAt: this.refreshExpiry(),
        },
      });
    });

    if (!next) {
      await this.revokeFamily(current.familyId);
      throw new UnauthorizedException('Refresh token replay detected');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: current.userId },
      include: authUserInclude,
    });
    if (!user?.isActive) {
      await this.revokeFamily(current.familyId);
      throw this.invalidSession();
    }

    return {
      accessToken: await this.signAccess(user.id, current.familyId),
      refreshToken: serializeOpaqueToken(next.id, nextSecret),
      user: toAuthenticatedUser(user, current.familyId),
    };
  }

  async authenticate(rawToken: string): Promise<AuthenticatedUser> {
    let payload: z.infer<typeof accessPayloadSchema>;
    try {
      payload = accessPayloadSchema.parse(await this.jwt.verifyAsync(rawToken));
    } catch {
      throw this.invalidSession();
    }

    const [activeSession, user] = await Promise.all([
      this.prisma.authSession.findFirst({
        where: {
          familyId: payload.familyId,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: authUserInclude,
      }),
    ]);

    if (!activeSession || !user?.isActive) throw this.invalidSession();
    return toAuthenticatedUser(user, payload.familyId);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private signAccess(userId: string, familyId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, familyId, type: 'access' },
      {
        expiresIn: this.config.get('AUTH_ACCESS_TTL_SECONDS', { infer: true }),
      },
    );
  }

  private refreshExpiry(): Date {
    const days = this.config.get('AUTH_REFRESH_TTL_DAYS', { infer: true });
    return new Date(Date.now() + days * 24 * 60 * 60 * 1_000);
  }

  private invalidSession(): UnauthorizedException {
    return new UnauthorizedException('Authentication required');
  }
}
