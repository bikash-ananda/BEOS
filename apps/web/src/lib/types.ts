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

export type ReactionKind = "ACKNOWLEDGE" | "SUPPORT" | "CELEBRATE";

export interface ReactionSummary {
  reactionCounts: Record<ReactionKind, number>;
  viewerReaction: ReactionKind | null;
}

export interface Discussion extends ReactionSummary {
  id: string;
  title: string;
  body: string;
  authorId: string;
  author: { id: string; fullName: string };
  editedAt: string | null;
  createdAt: string;
  _count: { comments: number };
}

export interface DiscussionComment extends ReactionSummary {
  id: string;
  discussionId: string;
  body: string;
  authorId: string;
  author: { id: string; fullName: string };
  editedAt: string | null;
  createdAt: string;
}

export type ConversationType =
  | "COMPANY"
  | "DEPARTMENT"
  | "PRIVATE_GROUP"
  | "DIRECT";

export interface CommunicationPerson {
  id: string;
  fullName: string;
  branch: OrganizationRef | null;
  department: OrganizationRef | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  department: OrganizationRef | null;
  members: Array<{ user: CommunicationPerson }>;
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; fullName: string };
  }>;
  readAt: string | null;
  unread: number;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  body: string;
  authorId: string;
  author: { id: string; fullName: string };
  editedAt: string | null;
  createdAt: string;
}

export type AnnouncementTarget = "COMPANY" | "BRANCH" | "DEPARTMENT" | "USERS";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  target: AnnouncementTarget;
  author: { id: string; fullName: string };
  branch: OrganizationRef | null;
  department: OrganizationRef | null;
  editedAt: string | null;
  readAt: string | null;
  createdAt: string;
  _count: { recipients: number };
}

export type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MeetingRsvp = "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED";
export type WorkPerson = Pick<
  CommunicationPerson,
  "id" | "fullName" | "branch" | "department"
>;

export interface MeetingSummary {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: MeetingStatus;
  organizerId: string;
  organizer: { id: string; fullName: string };
  participants: Array<{
    userId: string;
    rsvp: MeetingRsvp;
    user: { id: string; fullName: string };
  }>;
  _count: { agendaItems: number; tasks: number };
}

export interface WorkTaskSummary {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  createdById: string;
  createdBy: { id: string; fullName: string };
  assignees: Array<{ userId: string; user: { id: string; fullName: string } }>;
  meeting: { id: string; title: string } | null;
  _count: { comments: number; attachments: number };
}

export interface WorkAttachment {
  file: Pick<WorkspaceFile, "id" | "originalName" | "mimeType" | "sizeBytes">;
}

export interface WorkTaskDetail
  extends Omit<WorkTaskSummary, "meeting" | "_count"> {
  meeting: { id: string; title: string; startsAt: string } | null;
  agendaItem: { id: string; title: string; position: number } | null;
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; fullName: string };
  }>;
  attachments: WorkAttachment[];
}

export interface MeetingDetail extends Omit<MeetingSummary, "_count"> {
  agendaItems: Array<{
    id: string;
    title: string;
    details: string | null;
    position: number;
    notes: Array<{
      id: string;
      kind: "NOTE" | "MINUTE";
      body: string;
      createdAt: string;
      author: { id: string; fullName: string };
    }>;
    decisions: Array<{
      id: string;
      body: string;
      createdAt: string;
      author: { id: string; fullName: string };
    }>;
    tasks: WorkTaskSummary[];
  }>;
  notes: Array<{
    id: string;
    kind: "NOTE" | "MINUTE";
    body: string;
    createdAt: string;
    author: { id: string; fullName: string };
  }>;
  decisions: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; fullName: string };
  }>;
  attachments: WorkAttachment[];
}

export interface WorkSummary {
  upcomingMeetings: number;
  dueTasks: number;
  overdueTasks: number;
}
