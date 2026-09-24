# BEOS Implementation Plan

Last updated: 2026-08-27

This is the living implementation tracker for turning BEOS into a usable,
production-oriented system. Checkboxes are completed only after the relevant
code and verification pass.

## Locked decisions

- Build Phase 1 before future business modules.
- Use the existing Next.js, NestJS, PostgreSQL, Prisma, and pnpm modular
  monolith.
- Invite employees through administrator-generated links; do not add public
  signup or email delivery in Phase 1.
- Use English only in Phase 1.
- Store attachments on the local filesystem behind a replaceable storage
  interface.
- Persist communication in PostgreSQL and deliver live updates with WebSockets.
- Redesign the demo dashboard as a collaboration-first workspace.
- Never create Git commits automatically. Report when to commit and suggest a
  short message.
- Confirm every destructive database operation, even while local data is
  disposable.

## Iteration 1 — Trustworthy foundation

- [x] Inspect the repository, product documents, schema, and static UI data.
- [x] Record the implementation order and product decisions.
- [x] Restore loopback-only Docker PostgreSQL access for the host API.
- [x] Add centralized, validated environment configuration.
- [x] Add the global Prisma lifecycle module and readiness check.
- [x] Add API versioning, validation, CORS, security headers, structured logs,
      request IDs, consistent errors, and OpenAPI documentation.
- [x] Remove incomplete accounting source code from the active API build while
      preserving its migration history.
- [x] Pass formatting, lint, unit tests, API tests, Prisma validation, and both
      production builds.
- [x] Confirm live database readiness through Docker.
- [x] Reconcile all foundation documentation after verification.

## Iteration 2 — Identity and access

- [x] Design and migrate invitations and revocable multi-device sessions.
- [x] Add the first-administrator bootstrap command and idempotent RBAC seed.
- [x] Implement invite acceptance, login, refresh rotation, logout, logout-all,
      current-user, password change, and administrator password reset.
- [x] Add backend permission guards and audit identity/security events.
- [x] Add protected web routes and real session-aware navigation.
- [x] Add administrator workflows for users, roles, permissions, branches, and
      departments.
- [x] Verify invitation expiry, refresh replay rejection, session revocation,
      disabled accounts, and 401/403 boundaries.

## Iteration 3 — Dynamic workspace shell

- [x] Break the demo page into a maintainable application shell and UI
      components.
- [x] Replace all fake profile, branch, dashboard, meeting, activity, and
      discussion data with authenticated API data.
- [x] Display only implemented modules allowed by the current user's
      permissions.
- [x] Add loading, empty, error, and permission-denied states.
- [x] Verify responsive and keyboard-accessible behavior.

## Iteration 4 — Files, audit, and notifications

- [x] Centralize audit recording for sensitive changes.
- [x] Add persistent notifications, unread counts, and read/read-all actions.
- [x] Add file metadata and explicit Workspace attachment relations.
- [x] Add authorized local file upload/download through a storage interface.
- [x] Validate content, file signatures, size limits, filenames, and access.
- [x] Document coordinated database and file backup/restore.

## Iteration 5 — Workspace communication

- [x] Add company discussions, comments, reactions, editing, and soft deletion.
- [x] Add company, department, private-group, and direct conversations.
- [x] Add targeted announcements and read receipts.
- [x] Add authenticated WebSocket updates with reconnect/refetch recovery.
- [x] Verify membership, authorization, ordering, pagination, and reconnects.

## Iteration 6 — Meetings and tasks

- [x] Add meetings, participants, RSVP, agendas, notes, minutes, and decisions.
- [x] Add tasks, assignees, priorities, due dates, comments, and attachments.
- [x] Connect assignments and changes to notifications and live updates.
- [x] Drive Workspace summaries entirely from persisted Phase 1 records.

## Iteration 7 — Phase 1 production release

- [x] Split the Prisma schema by domain using its supported multi-file layout.
- [x] Generate web API types from the OpenAPI contract.
- [x] Add verified database indexes, rate limits, upload quotas, and sanitized
      production logging.
- [x] Add database integration, component, and browser journey coverage.
- [x] Test migrations against empty and populated pre-release databases.
- [x] Document deployment, migration, backup, restore, rollback, and bootstrap.
- [x] Remove remaining dead code, demo assets, and unused dependencies.

## Later product backlog

- [ ] CRM, customers, projects, quotations, and service requests.
- [ ] Sales orders, invoices, payments, and verified Nepal billing rules.
- [ ] Suppliers, procurement, warehouses, and inventory.
- [ ] Accounting and financial reporting.
- [ ] HR, attendance, leave, and payroll.
- [ ] Assets, maintenance, warranties, and field operations.
- [ ] Customer portal and e-commerce.
- [ ] IoT integrations.
- [ ] Permission-aware AI assistance.
- [ ] Mobile and offline synchronization.

## Working rules

- Do not use demo records as a fallback for API failures.
- Keep static configuration such as permission keys and status enums in code;
  keep editable business records in PostgreSQL.
- Keep files focused; split them when responsibilities diverge rather than
  waiting for an arbitrary line limit.
- Prefer established libraries when they materially reduce custom code. Record
  every new dependency and its purpose in the iteration report.
- Do not check off work while required verification is failing.

## Iteration 2 implementation notes

- Administrative identity APIs are split by users, roles, and organization;
  system roles remain source-managed while editable company roles are stored in
  PostgreSQL.
- The web app proxies API traffic through `BACKEND_URL`, protects workspace
  routes with the current authenticated session, and retries an expired access
  token once through refresh rotation.
- Administrator-generated invitation and password-reset links are copied for
  manual delivery. Secret token hashes are never returned by list endpoints.
- Added established web libraries instead of custom equivalents:
  `@tanstack/react-query` for server state, `react-hook-form`, `zod`, and
  `@hookform/resolvers` for validated forms, `lucide-react` for icons, and
  `sonner` for mutation feedback.
- The previous static dashboard and handwritten SVG switch were removed. UI,
  auth, workspace, and administration responsibilities now live in separate
  components and stylesheets.

## Iteration 3 implementation notes

- Shared query states now distinguish loading, empty, recoverable errors, and
  permission denial. Session failures only redirect to login for an actual
  unauthorized response; network and server failures remain retryable.
- User and invitation administration now use bounded server-side search and
  pagination. Shared query validation and matching client/server input limits
  prevent unbounded or malformed requests.
- Generated invitation and password-reset links remain visible for manual copy
  when clipboard access is unavailable, and mutation controls prevent duplicate
  submissions.
- The workspace includes skip navigation, keyboard-operable administration
  tabs, managed drawer focus, and explicit responsive states. Desktop and mobile
  Firefox checks confirmed the public authentication layout at 1440x900 and
  390x844; protected workspace behavior is covered by static, unit, and end-to-end
  verification.
- Removed decorative counters, implementation-oriented copy, an unnecessary
  authentication grid, and hard offset shadows. No dependency was added in this
  iteration.

## Iteration 4 implementation notes

- Audit recording now accepts a transaction writer so sensitive identity,
  notification, and file events can commit atomically with their domain change.
  The permission-gated audit register supports bounded search and pagination.
- Persistent, deduplicated notifications include unread counts, individual and
  bulk read actions, a workspace history page, and a global notification drawer.
  Invitation acceptance, password-reset completion, and access changes create
  notifications inside their database transaction.
- Files use immutable metadata, explicit company/branch/department attachment
  scope, permission-aware visibility, and a replaceable storage interface. The
  local implementation uses random keys, atomic writes, restrictive file modes,
  traversal protection, and storage rollback when the database transaction
  fails.
- Upload validation enforces configured size limits, normalized filenames,
  allowed extensions, declared content type, binary signatures, and valid text
  content. Downloads re-check scope authorization and return hardened response
  headers.
- The coordinated PostgreSQL/filesystem recovery process is documented in
  `docs/BACKUP_RESTORE.md`, including checksums and isolated restore tests.
- The workspace follows the approved Engineering Field Ledger direction. The
  static interface detector reported no findings. Safe headless Firefox capture
  could not wait for authenticated client hydration, so protected-page visual
  capture remains unconfirmed; the user approved proceeding without additional
  PNG work.
- New interface styles are divided by notifications, files, and audit rather
  than kept in one growing workspace stylesheet. No dependency was added in
  this iteration; the implementation uses the existing Nest platform support
  and Node standard-library primitives.

## Iteration 5 implementation notes

- Communication records now live in PostgreSQL. Discussions support comments,
  reactions, author or manager editing, and soft deletion; conversation types
  cover company, department, private-group, and direct membership policies.
- Announcements snapshot their authorized company, branch, department, or
  selected-user audience when published. Recipient read state, notifications,
  and audit records commit transactionally with the announcement change.
- The authenticated Socket.IO namespace reads the existing HttpOnly access
  cookie, joins per-user delivery rooms, and signals reconnect readiness. The
  web client refetches authoritative communication and notification data after
  readiness or change events instead of treating live messages as durable
  state.
- Communication authorization is enforced by dedicated read, write, manage,
  and announcement permissions. Private and direct conversations remain hidden
  from non-members, including otherwise privileged administrators.
- Added established Socket.IO integration packages rather than a custom live
  protocol: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, and
  `cookie` in the API; `socket.io-client` in the web app and API test tooling.
- End-to-end coverage verifies discussion lifecycle, private membership,
  message ordering and edits, receipts, targeted announcements, authenticated
  live delivery, rejected unauthenticated sockets, and reconnect recovery.
  Communication forms and workbench/read styles are kept in separate files,
  while conversation visibility and recipient policy live in a focused service.
- The approved Engineering Field Ledger direction remains intact. The single
  Impeccable static detector pass reported no findings; protected visual capture
  was not repeated under the previously approved no-PNG workflow.

## Iteration 6 implementation notes

- Meetings and tasks now use normalized PostgreSQL records for participants,
  RSVP, agendas, notes, minutes, decisions, assignees, comments, and file links.
  The migration was applied without destructive operations and Prisma reports
  all six migrations up to date.
- Meeting and task visibility follows participation, assignment, linked-meeting,
  branch, and explicit management permissions. Invitations and assignments
  create persistent notifications; significant changes are audited.
- The shared authenticated `/workspace` Socket.IO namespace now carries live
  communication and work invalidation events. Reconnect readiness triggers an
  authoritative refetch instead of treating socket payloads as durable state.
- The approved Twin Registers interface at `/work` provides searchable and
  date-filtered meeting and task registers, a shared record pane, lifecycle
  controls, meeting outcomes, task comments, deep links, and workspace-file
  linking. The overview counts upcoming, open, and overdue work from persisted
  records and remains truthful when registers are empty.
- Work UI responsibilities are divided across workspace coordination, meeting
  records, task records, forms, attachment controls, shared record primitives,
  and three focused stylesheets. No new dependency was needed for Iteration 6.
- End-to-end coverage verifies meeting privacy and outcomes, task membership and
  lifecycle, file links, comments, notifications-related access, and live work
  events. The full repository verification passed: 7 unit tests, 14 end-to-end
  tests, Prisma validation, lint, formatting, and both production builds.
- The single Impeccable detector pass reported zero findings. Protected-page
  screenshot capture was not repeated under the previously approved no-PNG
  workflow; the approved decision comparison remains in `.impeccable/mocks`.

## Iteration 7 implementation notes

- Prisma now uses its supported multi-file schema directory, grouped into nine
  domain files. The CLI is configured through `prisma.config.ts`; splitting the
  source introduced no database change or migration.
- Nest's Swagger compiler emits a tracked OpenAPI document, and
  `openapi-typescript` generates the web contract. Frontend paths are checked
  against that contract at compile time, while `contract:check` fails when
  either generated artifact is stale.
- Existing query indexes were reconciled with the Phase 1 list, visibility,
  unread, due-date, participant, assignee, and file-scope access patterns. No
  speculative or redundant index migration was added. Global request limits,
  stricter authentication limits, exact trusted-proxy hops, upload byte limits,
  transactionally serialized per-user and workspace quotas, bounded request
  IDs, and secret-redacted structured logging are configurable by environment.
- Vitest and Testing Library now cover an interactive component contract.
  Playwright verifies the login validation and submission journey in real
  Firefox at desktop and 390px mobile widths; both journeys pass. The existing
  database end-to-end suite now also covers middleware file-size and persistent
  quota rejection, pending its explicitly approved isolated database run.
- Production deployment, configuration, proxying, migration, bootstrap,
  backup/restore, rollback, and isolated rehearsal requirements are documented.
  Unreferenced Next.js starter SVGs and an obsolete migration console transcript
  were removed. Direct production dependencies remain source-used; new tooling
  is development-only: `dotenv`, `openapi-typescript`, Vitest, Testing Library,
  jsdom, and Playwright.
- The complete six-migration chain applied cleanly to isolated empty databases.
  A custom-format snapshot of the local pre-release database restored into a
  separate target with matching representative row counts, no pending
  migrations, and current schema status. All three approved test databases and
  the temporary dump were removed afterward; the original database remained at
  its pre-test representative count.
- Formatting, lint, API unit tests, 14 database end-to-end tests, web component
  tests, generated-contract freshness, Prisma validation/generation, TypeScript
  checking, desktop/mobile browser journeys, and both production builds pass.
