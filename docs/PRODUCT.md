# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Bikash Engineering employees use one authenticated workspace to reach the
  company tools and records permitted for their role and organizational scope.
- Company administrators provision employee access, issue invitations, manage
  roles and permissions, organize branches and departments, reset access, and
  disable accounts when required.
- Customer-facing and public audiences are outside the current internal
  workspace release. Their future workflows remain undecided.

## Product Purpose

BEOS is the internal digital operating system for Bikash Engineering Pvt. Ltd.
It brings company operations into a shared, permission-aware workspace instead
of relying on disconnected tools, demo records, or static interface data.

The current goal is a trustworthy Company Workspace with identity,
administration, files, notifications, communication, meetings, and tasks.
Success means employees can complete real work from persisted company records
while administrators retain clear control over access and organizational scope.

## Positioning

BEOS uses one shared identity, permission, and organization model as the spine
for every business capability. New modules inherit the same employee, role,
branch, department, audit, and access boundaries rather than becoming isolated
tools with separate accounts or duplicated company data.

## Operating Context

- Employees access BEOS through a responsive web application.
- The first administrator is created through a controlled bootstrap process.
  Further employees join through administrator-generated, expiring invitation
  links; there is no public signup or automatic email delivery in Phase 1.
- Administrators maintain organization and access records. Other workspace
  tools appear only when they are implemented and permitted for the current
  user.
- Phase 1 is English-only. A native mobile application and offline field work
  follow only after the web/API workspace is stable.

## Capabilities and Constraints

Current, verified capabilities:

- Credential login, rotating access and refresh sessions, logout, logout-all,
  invitation acceptance, password changes, and administrator password resets.
- Revocable multi-device sessions, disabled-account enforcement, role-based
  permissions, and audited identity and administration changes.
- PostgreSQL-backed employee, role, permission, branch, and department
  administration with bounded search and pagination where needed.
- A protected, responsive workspace shell that shows authenticated company data
  and recoverable loading, empty, error, and permission states.

Committed delivery constraints:

- Editable business records belong in PostgreSQL. Static data is limited to
  source-managed configuration such as permission keys and status enums; mock
  records must not appear as production fallbacks.
- The system remains a TypeScript modular monolith: Next.js web application,
  NestJS API, PostgreSQL, Prisma, and pnpm workspaces.
- Attachments use local filesystem storage behind a replaceable storage
  interface. Communication is persisted in PostgreSQL, with WebSockets planned
  for live delivery and reconnect recovery.
- Features are released in verified iterations. Files, notifications, broader
  auditing, communication, meetings, and tasks are planned work, not current
  product claims.
- The exact company headcount, number of offices, and business-domain catalog
  are deliberately not product facts. Those previous values were mock data and
  must not be restored as static content.

## Brand Commitments

- Product name: **BEOS — Bikash Engineering Operating System**.
- Organization: **Bikash Engineering Pvt. Ltd.**, based in Pokhara, Nepal and
  established in 2023 AD.
- Product language should be direct, calm, and operational. User-facing copy
  describes work and outcomes rather than implementation or security mechanics.

## Evidence on Hand

- The running web and API applications, Prisma migrations, automated tests, and
  `docs/IMPLEMENTATION_PLAN.md` demonstrate the currently verified product
  capabilities and delivery sequence.
- The repository contains no verified production company dataset, customer
  proof, testimonials, pricing, benchmarks, or finalized product logo. Future
  product and interface work must not fabricate them.
- Generic framework SVG files under `apps/web/public` are not BEOS brand assets.

## Product Principles

1. **Real records, never demo fallbacks.** Empty and failure states must remain
   truthful instead of substituting static company activity or metrics.
2. **One organizational spine.** Employees, permissions, roles, branches, and
   departments provide shared context for every module.
3. **Access is explicit.** Server authorization is authoritative, sensitive
   changes are auditable, and the interface exposes only usable capabilities.
4. **Ship verified slices.** Each iteration must be usable, maintainable, and
   production-oriented before the next operating domain is added.
5. **Keep future options replaceable.** Storage, live delivery, and later mobile
   clients integrate through clear boundaries rather than duplicated systems.

## Accessibility & Inclusion

BEOS must remain usable with keyboard navigation and across supported desktop
and mobile web sizes. Loading, empty, error, and denied states must be explicit
and recoverable where possible. Controls require meaningful labels, visible
focus, and readable contrast. English is the confirmed Phase 1 language;
localization requirements after Phase 1 remain open.
