import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../../rbac/permissions';
import { PERMISSIONS_KEY } from '../auth.constants';

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
