# BEOS — Bikash Engineering Operating System

Digital operating system for **Bikash Engineering Pvt. Ltd.** in Pokhara,
Nepal.

BEOS is a pnpm modular-monolith workspace:

- `apps/api` — NestJS API on port 3001
- `apps/web` — Next.js application on port 3000
- `infra` — local PostgreSQL infrastructure
- `docs` — product decisions and implementation progress

## Requirements

- Node.js 22 or newer
- pnpm 10.34.5
- Docker Engine or Docker Desktop with Docker Compose

## Local setup

Install dependencies and create the API and web environment files:

```sh
pnpm install
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Start PostgreSQL and apply existing migrations:

```sh
pnpm db:up
pnpm db:migrate
```

Run the API and web application in separate terminals:

```sh
pnpm dev:api
pnpm dev:web
```

Local endpoints:

- Web application: http://localhost:3000
- API liveness: http://localhost:3001/api/v1/health
- API database readiness: http://localhost:3001/api/v1/ready
- API documentation: http://localhost:3001/api/docs

PostgreSQL is exposed only on `127.0.0.1:5432` for local development.

`WEB_ORIGIN` is the API's allowlist for credentialed browser requests.
`BACKEND_URL` is server-only Next.js configuration used to proxy `/api`
requests to the NestJS service, keeping authentication cookies same-origin in
the browser. Change both values to match the deployed web and API origins.

## Verification

After the environment file and database are available, run:

```sh
pnpm verify
```

This checks formatting, lint, unit and API tests, the Prisma schema, and both
production builds.

## First administrator

Seed the managed system roles and permissions at any time with:

```sh
pnpm rbac:seed
```

Create the first administrator once by supplying credentials through temporary
environment variables:

```sh
BOOTSTRAP_ADMIN_EMAIL="admin@example.com" \
BOOTSTRAP_ADMIN_NAME="Administrator" \
BOOTSTRAP_ADMIN_PASSWORD="replace-with-a-strong-password" \
pnpm bootstrap:admin
```

The bootstrap command refuses to overwrite an existing account. Do not place
the administrator password in a tracked environment file.

After signing in, administrators can create branches and departments, define
custom roles, generate one-time invitation and password-reset links, update
employee assignments, and disable accounts from `/admin`.

## Current work

Phase 1 builds Identity & Access and the Company Workspace before later
business modules. Progress, decisions, and the next verified slice live in
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

Coordinated PostgreSQL and file recovery procedures live in
[`docs/BACKUP_RESTORE.md`](docs/BACKUP_RESTORE.md).
