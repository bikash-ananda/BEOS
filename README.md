# BEOS — Bikash Engineering Operating System

Digital operating system for **Bikash Engineering Pvt. Ltd.** (Pokhara, Nepal).

This repository is a **pnpm monorepo**:

- `apps/api` — NestJS API (port **3001**)
- `apps/web` — Next.js web app (port **3000**)
- `infra` — Docker Compose for local PostgreSQL
- `docs` — Product and Phase 1 specifications

## What you need on this computer

1. **Node.js** 22 or newer
2. **Git**
3. **pnpm** (installed for this project)
4. **Docker Desktop** — required to run PostgreSQL. Install from [Docker Desktop](https://www.docker.com/products/docker-desktop/), start Docker, then run the database steps below.

## How to start the website and API (no database required)

Open PowerShell in this folder.

Terminal 1 — API:

```powershell
pnpm --filter api start:dev
```

Terminal 2 — website:

```powershell
pnpm --filter web dev
```

Then open:

- Website: http://localhost:3000
- API health: http://localhost:3001/health

## How to start PostgreSQL (after Docker Desktop is installed)

```powershell
docker compose -f infra/docker-compose.yml up -d
pnpm --filter api exec prisma migrate dev --name init_identity
```

That command creates the Wave 0 identity tables (users, roles, permissions, branches, departments, audit log).

## Wave 0 status

- Monorepo, NestJS, Next.js, and Prisma **schema** are in place.
- Login and Company Workspace come in later waves.
- Mobile is not in this phase.
- PostgreSQL migration is waiting on Docker Desktop on this computer.
