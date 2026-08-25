import { Request } from 'express';
import { AuthenticatedUser } from './auth-user';

export type AuthenticatedRequest = Request & {
  authUser: AuthenticatedUser;
};

export interface ClientContext {
  ipAddress?: string;
  userAgent?: string;
}

export function getClientContext(request: Request): ClientContext {
  return {
    ipAddress: request.ip,
    userAgent: request.get('user-agent'),
  };
}

export function getCookie(request: Request, name: string): string | undefined {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[name];
  return typeof value === 'string' ? value : undefined;
}
