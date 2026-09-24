---
version: 1
slug: "src-app-workspace-communication-page-tsx"
primary_target: "src/app/(workspace)/communication/page.tsx"
related_targets: ["src/components/communication/communication-workspace.tsx","src/components/workspace/workspace-shell.tsx"]
---

## Scope and mode

Operate. The Communication route is the Iteration 5 workspace for company
discussions, scoped conversations, and targeted announcements.

## Audience and task

Authenticated employees read and participate in company discussions, continue
authorized conversations, and acknowledge announcements. Communication
managers create company or department channels, moderate records, and publish
announcements within their organizational scope.

## Content and constraints

- All content is persisted; never show invented discussion, message,
  announcement, reaction, membership, or read data.
- Company and department conversations derive visibility from the employee's
  current assignment. Private-group and direct conversations require explicit
  membership.
- Pagination is server-owned. Optimistic-looking live updates still refetch
  authoritative records after Socket.IO events and reconnects.
- Editing is limited to the author or communication managers. Deletion is soft.
- Loading, empty, error, denied, disconnected, reconnecting, unread, edited,
  and deleted states remain explicit and keyboard operable.

## Chosen direction

Extend the established Engineering Field Ledger and the previously approved
Focused Register composition. Use a ruled three-part workbench: a compact
mode index, a focused record register, and a contextual reading/composition
pane. On narrow screens those regions become one ordered flow rather than a
generic chat shell.

The memorable interaction is live status appearing as a restrained technical
coordinate while incoming persisted changes refresh the active register
without shifting the user's reading position.

## Unresolved decisions

None for Iteration 5. Future attachment support belongs to the meetings/tasks
iteration and reuses the existing file-storage model.
