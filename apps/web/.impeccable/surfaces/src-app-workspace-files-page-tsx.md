---
version: 1
slug: "src-app-workspace-files-page-tsx"
primary_target: "src/app/(workspace)/files/page.tsx"
related_targets: ["src/app/(workspace)/notifications/page.tsx","src/components/workspace/workspace-shell.tsx"]
---

## Scope and mode

Operate. The workspace Files route, global notification drawer, and full
notification history route form the Iteration 4 records surface.

## Audience and task

Authenticated employees find files visible to their company assignment,
download authorized records, and upload within their permitted scope.
Notifications surface persistent account and workspace changes without
displacing the primary task.

## Content and constraints

- Files are PostgreSQL metadata backed by authorized local storage; never show
  invented file rows or counts.
- Company, branch, and department visibility follows the authenticated user.
- Upload supports PDF, PNG, JPEG, WebP, TXT, CSV, and Markdown up to 10 MB.
- Loading, empty, error, denied, unread, read, upload, and download states must
  remain explicit and keyboard operable.
- Desktop uses the full-width ledger; mobile keeps the ledger accessible and
  turns the notification drawer into a full-width surface.

## Chosen direction

Engineering Field Ledger using the approved Focused Register with Notification
Drawer composition. Approved comp:
`.impeccable/mocks/iteration-4-notification-drawer.png`.

The memorable moment is the header bell opening a precisely ruled notification
drawer over the right edge while the file register remains visibly in context.

## Unresolved decisions

None for Iteration 4.
