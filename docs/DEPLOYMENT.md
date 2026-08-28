# BEOS Production Deployment

This runbook describes a single-instance Phase 1 deployment: one NestJS API,
one Next.js web process, PostgreSQL 16 or newer, and a durable local filesystem
mounted at `FILE_STORAGE_PATH`. Run PostgreSQL and file storage on persistent,
backed-up volumes. Horizontal API scaling requires shared file storage and a
distributed rate-limit and Socket.IO adapter before adding replicas.

## Release inputs

- A reviewed Git revision and the matching `pnpm-lock.yaml`.
- Node.js 22 or newer and pnpm 10.34.5.
- A PostgreSQL connection with schema-change privileges during migration.
- TLS terminated by a reverse proxy.
- A dedicated, writable upload directory; never use `/`, a home directory, or
  a shared application directory.
- A coordinated database and file backup as described in
  `docs/BACKUP_RESTORE.md`.

## Required configuration

Start from `.env.example`; keep production values in the deployment secret
store, not in Git. Production requires:

- `NODE_ENV=production`
- `DATABASE_URL` using a production PostgreSQL role and database
- `WEB_ORIGIN` containing only the exact HTTPS browser origin(s)
- a random `AUTH_ACCESS_SECRET` of at least 32 characters
- `AUTH_COOKIE_SECURE=true`
- `FILE_STORAGE_PATH` on the persistent file volume
- deliberate file size, per-user quota, and total workspace quota values
- `TRUST_PROXY_HOPS` equal to the exact number of trusted proxies before Nest
- `BACKEND_URL` reachable by the Next.js server

`API_RATE_LIMIT` and `API_RATE_TTL_MS` configure the in-process global limiter.
Authentication endpoints retain stricter source-defined limits. `LOG_LEVEL`
defaults to `info`; request cookies, authorization headers, API keys, password
fields, reset/invitation tokens, and response cookies are redacted.

## Reverse proxy contract

Expose only the HTTPS web origin publicly. Route `/api/*` to Next.js, whose
rewrite forwards it to `BACKEND_URL`. For same-origin live updates, forward
WebSocket upgrades for `/api/v1/socket.io` to the API and leave
`NEXT_PUBLIC_API_ORIGIN` empty. If the browser connects directly to a separate
API origin, set `NEXT_PUBLIC_API_ORIGIN` at web build time and include that exact
origin in `WEB_ORIGIN`.

Forward the client address only through trusted infrastructure. A wrong
`TRUST_PROXY_HOPS` value lets clients spoof rate-limit identities or causes all
traffic to share one identity.

## Build and release sequence

1. Install exactly the locked dependency graph:

   ```sh
   corepack enable
   pnpm install --frozen-lockfile
   ```

2. Load the production API configuration and run non-mutating checks:

   ```sh
   node scripts/check-contract.mjs
   pnpm --filter api exec prisma validate
   pnpm --filter api lint
   pnpm --filter web lint
   pnpm --filter api test --runInBand
   pnpm --filter web test
   pnpm build
   ```

3. Enter a write-maintenance window. Stop the old API workers and create the
   coordinated backup.
4. Inspect pending migrations, then apply them once:

   ```sh
   pnpm --filter api exec prisma migrate status
   pnpm --filter api exec prisma migrate deploy
   ```

   Production uses `migrate deploy`, never `migrate dev` or `db push`.

5. Start both built services with `pnpm start`. A process supervisor must
   restart failed processes and retain structured stdout/stderr logs.
6. Before restoring write traffic, confirm:

   - `/api/v1/health` returns success;
   - `/api/v1/ready` confirms PostgreSQL connectivity;
   - `/api/docs` reflects the released contract;
   - an administrator can sign in and refresh a session;
   - an authorized user can list and download an existing file;
   - Socket.IO connects through the deployed proxy path.

7. End maintenance and watch error rate, readiness, disk capacity, database
   connections, and quota responses.

## First deployment bootstrap

Run the idempotent permission seed, then create the first administrator exactly
once:

```sh
pnpm --filter api rbac:seed
BOOTSTRAP_ADMIN_EMAIL="admin@example.com" \
BOOTSTRAP_ADMIN_NAME="Administrator" \
BOOTSTRAP_ADMIN_PASSWORD="use-a-temporary-secret-channel" \
pnpm --filter api bootstrap:admin
```

The bootstrap command refuses to overwrite an existing account. Remove the
temporary password from shell history and the deployment environment after the
command completes.

## Rollback

Prisma production migrations are forward-only. Do not improvise a down
migration against live data.

- If the release fails before a migration, restart the previous application
  revision.
- If migrations ran and are backward compatible, keep the migrated database
  and run the previous revision only when its compatibility is documented.
- If a migration or new writes made the old revision incompatible, stop write
  traffic and restore the coordinated pre-release database dump and file
  archive into verified empty targets. Follow `docs/BACKUP_RESTORE.md`, then
  point the previous revision at the restored targets.
- Preserve the failed environment and logs for diagnosis. Never run `migrate
reset`, delete migration rows, or edit an applied migration in production.

Record the deployed revision, migration names, backup manifest, approver,
timestamps, health evidence, and rollback decision for every release.
