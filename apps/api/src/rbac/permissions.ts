export const PERMISSION_KEYS = {
  workspaceAccess: 'workspace.access',
  usersManage: 'users.manage',
  rolesManage: 'roles.manage',
  branchesManage: 'branches.manage',
  departmentsManage: 'departments.manage',
  invitationsManage: 'invitations.manage',
  auditRead: 'audit.read',
  filesRead: 'files.read',
  filesUpload: 'files.upload',
} as const;

export type PermissionKey =
  (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export const SYSTEM_PERMISSIONS: ReadonlyArray<{
  key: PermissionKey;
  description: string;
}> = [
  { key: PERMISSION_KEYS.workspaceAccess, description: 'Access the workspace' },
  { key: PERMISSION_KEYS.usersManage, description: 'Manage employee accounts' },
  {
    key: PERMISSION_KEYS.rolesManage,
    description: 'Manage roles and permissions',
  },
  { key: PERMISSION_KEYS.branchesManage, description: 'Manage branches' },
  { key: PERMISSION_KEYS.departmentsManage, description: 'Manage departments' },
  { key: PERMISSION_KEYS.invitationsManage, description: 'Invite employees' },
  { key: PERMISSION_KEYS.auditRead, description: 'Read audit records' },
  { key: PERMISSION_KEYS.filesRead, description: 'Read workspace files' },
  { key: PERMISSION_KEYS.filesUpload, description: 'Upload workspace files' },
];

const allPermissions = SYSTEM_PERMISSIONS.map(({ key }) => key);

export const SYSTEM_ROLES: ReadonlyArray<{
  name: string;
  description: string;
  permissions: readonly PermissionKey[];
}> = [
  {
    name: 'Super Admin',
    description: 'Full BEOS administration access',
    permissions: allPermissions,
  },
  {
    name: 'Director',
    description: 'Company-wide management access',
    permissions: allPermissions,
  },
  {
    name: 'Manager',
    description: 'Workspace and employee administration access',
    permissions: [
      PERMISSION_KEYS.workspaceAccess,
      PERMISSION_KEYS.usersManage,
      PERMISSION_KEYS.invitationsManage,
      PERMISSION_KEYS.filesRead,
      PERMISSION_KEYS.filesUpload,
    ],
  },
  ...['Accountant', 'Engineer', 'Storekeeper', 'Technician', 'HR', 'Sales'].map(
    (name) => ({
      name,
      description: `${name} workspace access`,
      permissions: [
        PERMISSION_KEYS.workspaceAccess,
        PERMISSION_KEYS.filesRead,
        PERMISSION_KEYS.filesUpload,
      ],
    }),
  ),
];
