import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ACCESS_COOKIE, IS_PUBLIC_KEY } from '../auth.constants';
import { AuthenticatedRequest, getCookie } from '../auth-request';
import { AuthTokenService } from '../auth-token.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: AuthTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Authentication required');

    request.authUser = await this.tokens.authenticate(token);
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookieToken = getCookie(request, ACCESS_COOKIE);
    if (cookieToken) return cookieToken;

    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    return scheme === 'Bearer' ? token : undefined;
  }
}
