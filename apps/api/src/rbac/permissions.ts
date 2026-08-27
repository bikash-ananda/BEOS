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
  communicationRead: 'communication.read',
  communicationWrite: 'communication.write',
  communicationManage: 'communication.manage',
  announcementsManage: 'announcements.manage',
  meetingsRead: 'meetings.read',
  meetingsWrite: 'meetings.write',
  meetingsManage: 'meetings.manage',
  tasksRead: 'tasks.read',
  tasksWrite: 'tasks.write',
  tasksManage: 'tasks.manage',
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
  {
    key: PERMISSION_KEYS.communicationRead,
    description: 'Read workspace communication',
  },
  {
    key: PERMISSION_KEYS.communicationWrite,
    description: 'Participate in workspace communication',
  },
  {
    key: PERMISSION_KEYS.communicationManage,
    description: 'Manage workspace communication',
  },
  {
    key: PERMISSION_KEYS.announcementsManage,
    description: 'Publish workspace announcements',
  },
  { key: PERMISSION_KEYS.meetingsRead, description: 'Read assigned meetings' },
  {
    key: PERMISSION_KEYS.meetingsWrite,
    description: 'Participate in meetings',
  },
  { key: PERMISSION_KEYS.meetingsManage, description: 'Manage meetings' },
  { key: PERMISSION_KEYS.tasksRead, description: 'Read assigned tasks' },
  { key: PERMISSION_KEYS.tasksWrite, description: 'Participate in tasks' },
  { key: PERMISSION_KEYS.tasksManage, description: 'Manage tasks' },
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
      PERMISSION_KEYS.communicationRead,
      PERMISSION_KEYS.communicationWrite,
      PERMISSION_KEYS.communicationManage,
      PERMISSION_KEYS.announcementsManage,
      PERMISSION_KEYS.meetingsRead,
      PERMISSION_KEYS.meetingsWrite,
      PERMISSION_KEYS.meetingsManage,
      PERMISSION_KEYS.tasksRead,
      PERMISSION_KEYS.tasksWrite,
      PERMISSION_KEYS.tasksManage,
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
        PERMISSION_KEYS.communicationRead,
        PERMISSION_KEYS.communicationWrite,
        PERMISSION_KEYS.meetingsRead,
        PERMISSION_KEYS.meetingsWrite,
        PERMISSION_KEYS.tasksRead,
        PERMISSION_KEYS.tasksWrite,
      ],
    }),
  ),
];
