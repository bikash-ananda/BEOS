import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionKey } from '../../rbac/permissions';
import { PERMISSIONS_KEY } from '../auth.constants';
import { AuthenticatedRequest } from '../auth-request';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const user = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().authUser;
    if (!user || !required.every((key) => user.permissions.includes(key))) {
      throw new ForbiddenException(
        'You do not have permission for this action',
      );
    }
    return true;
  }
}
