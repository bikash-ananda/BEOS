# BEOS Implementation Plan

Last updated: 2026-08-25

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

- [ ] Centralize audit recording for sensitive changes.
- [ ] Add persistent notifications, unread counts, and read/read-all actions.
- [ ] Add file metadata and explicit Workspace attachment relations.
- [ ] Add authorized local file upload/download through a storage interface.
- [ ] Validate content, file signatures, size limits, filenames, and access.
- [ ] Document coordinated database and file backup/restore.

## Iteration 5 — Workspace communication

- [ ] Add company discussions, comments, reactions, editing, and soft deletion.
- [ ] Add company, department, private-group, and direct conversations.
- [ ] Add targeted announcements and read receipts.
- [ ] Add authenticated WebSocket updates with reconnect/refetch recovery.
- [ ] Verify membership, authorization, ordering, pagination, and reconnects.

## Iteration 6 — Meetings and tasks

- [ ] Add meetings, participants, RSVP, agendas, notes, minutes, and decisions.
- [ ] Add tasks, assignees, priorities, due dates, comments, and attachments.
- [ ] Connect assignments and changes to notifications and live updates.
- [ ] Drive Workspace summaries entirely from persisted Phase 1 records.

## Iteration 7 — Phase 1 production release

- [ ] Split the Prisma schema by domain using its supported multi-file layout.
- [ ] Generate web API types from the OpenAPI contract.
- [ ] Add verified database indexes, rate limits, upload quotas, and sanitized
      production logging.
- [ ] Add database integration, component, and browser journey coverage.
- [ ] Test migrations against empty and populated pre-release databases.
- [ ] Document deployment, migration, backup, restore, rollback, and bootstrap.
- [ ] Remove remaining dead code, demo assets, and unused dependencies.

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
