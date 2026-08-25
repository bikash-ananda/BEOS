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

Install dependencies and create the API environment file:

```sh
pnpm install
cp .env.example apps/api/.env
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

## Verification

After the environment file and database are available, run:

```sh
pnpm verify
```

This checks formatting, lint, unit and API tests, the Prisma schema, and both
production builds.

## Current work

Phase 1 builds Identity & Access and the Company Workspace before later
business modules. Progress, decisions, and the next verified slice live in
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).
