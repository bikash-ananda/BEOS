import { Prisma } from '@prisma/client';

export const authUserInclude = {
  branch: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true, code: true } },
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  branch: AuthUserRecord['branch'];
  department: AuthUserRecord['department'];
  roles: string[];
  permissions: string[];
  sessionFamilyId: string;
}

export function toAuthenticatedUser(
  user: AuthUserRecord,
  sessionFamilyId: string,
): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    branch: user.branch,
    department: user.department,
    roles: user.roles.map(({ role }) => role.name),
    permissions: [
      ...new Set(
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.key),
        ),
      ),
    ],
    sessionFamilyId,
  };
}
