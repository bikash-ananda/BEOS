# Migration Rehearsal

Every release with a new Prisma migration must be tested against two isolated
PostgreSQL databases before production deployment.

## Empty database

Create a disposable empty database, point `DATABASE_URL` at it, and run:

```sh
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma migrate status
pnpm --filter api exec prisma validate
```

Then start the API, confirm `/api/v1/ready`, run the API end-to-end suite, and
discard only that explicitly identified rehearsal database.

## Populated pre-release database

Restore the latest sanitized production-like or previous-release backup into a
second isolated database. Record row counts for identity, audit, notification,
file, communication, meeting, and task records. Apply `prisma migrate deploy`,
then verify:

- migration status is current and all recorded row counts remain plausible;
- active users, role assignments, session refresh, and permission boundaries;
- file metadata still resolves to a matching staged file archive;
- discussions, private conversations, announcements, meetings, and tasks remain
  visible only to their authorized audiences;
- new writes, notifications, audit entries, and live invalidations succeed;
- the previous release's documented compatibility or restore-based rollback.

The rehearsal is intentionally not automated against a guessed database URL.
Creating, populating, migrating, and dropping databases are destructive
operations and require approval for the exact disposable targets. Never point
the rehearsal at development or production data.

## Evidence

Attach the database names, source backup manifest, Git revision, PostgreSQL
version, migration list, before/after counts, command exit codes, smoke-test
results, duration, and cleanup approval to the release record.
