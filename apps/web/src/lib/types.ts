export interface OrganizationRef {
  id: string;
  name: string;
  code: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  branch: OrganizationRef | null;
  department: OrganizationRef | null;
  roles: string[];
  permissions: string[];
}

export interface Permission {
  id: string;
  key: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  _count: { users: number };
}

export interface Branch extends OrganizationRef {
  city: string | null;
  isActive: boolean;
  _count: { departments: number; users: number };
}

export interface Department extends OrganizationRef {
  branchId: string;
  branch: OrganizationRef;
  isActive: boolean;
  _count: { users: number };
}

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  branch: OrganizationRef | null;
  department: OrganizationRef | null;
  roles: Array<{ id: string; name: string }>;
}

export interface Invitation {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  branch: OrganizationRef | null;
  department: OrganizationRef | null;
  roles: Array<{ id: string; name: string }>;
  invitedBy: { id: string; fullName: string };
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Notification {
  id: string;
  type: "ACCOUNT" | "SECURITY" | "WORKSPACE";
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage extends Page<Notification> {
  unread: number;
}

export type WorkspaceFileScope = "COMPANY" | "BRANCH" | "DEPARTMENT";

export interface WorkspaceFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
  uploadedBy: { id: string; fullName: string };
  workspaceAttachments: Array<{
    id: string;
    scope: WorkspaceFileScope;
    branch: OrganizationRef | null;
    department: OrganizationRef | null;
  }>;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string } | null;
}
