# BEOS Backup and Restore

BEOS files have two coordinated sources of truth:

- PostgreSQL stores file metadata, workspace attachment scope, notifications,
  audit history, identities, and all other business records.
- `FILE_STORAGE_PATH` stores the immutable file bytes referenced by PostgreSQL.

A valid recovery point must contain both sources from the same maintenance
window. A database dump without its matching file archive can restore metadata
that points to missing files.

## Production prerequisites

- Run backup and restore commands from a trusted host with PostgreSQL client
  tools matching the production PostgreSQL major version.
- Resolve `DATABASE_URL` and `FILE_STORAGE_PATH` from the deployed environment;
  do not copy secrets into this document or a tracked script.
- Store backups outside the application host and encrypt them according to the
  organization's retention policy.
- Record the BEOS Git revision, migration state, PostgreSQL version, UTC time,
  database dump name, file archive name, and both SHA-256 checksums in a backup
  manifest.

## Coordinated backup

1. Announce a maintenance window and stop API write traffic. The web application
   may show maintenance, but no upload or database mutation may continue.
2. Confirm the API is stopped before capturing either source.
3. Create a PostgreSQL custom-format dump:

   ```sh
   pg_dump --format=custom --no-owner --no-privileges \
     --file=beos-database.dump "$DATABASE_URL"
   ```

4. Archive the exact configured file root. From its parent directory:

   ```sh
   tar --create --gzip --file=beos-files.tar.gz "$(basename "$FILE_STORAGE_PATH")"
   ```

   `FILE_STORAGE_PATH` must resolve to the intended dedicated BEOS upload
   directory before running this command. Never use `/`, a home directory, or a
   broad shared directory as the archive target.

5. Record integrity checksums:

   ```sh
   sha256sum beos-database.dump beos-files.tar.gz
   ```

6. Store the dump, archive, manifest, and checksums together in protected backup
   storage. Restart the API only after both artifacts complete successfully.

Filesystem snapshots may replace the `tar` step when the storage platform
supports atomic snapshots. The snapshot must still be taken inside the same API
write pause as the database dump.

## Restore

Restores are destructive when pointed at an existing environment. Obtain
explicit approval for the exact target database and file directory, and restore
into an empty isolated environment first.

1. Verify the manifest and checksums:

   ```sh
   sha256sum --check beos-backup.sha256
   ```

2. Check out the recorded BEOS revision and install its locked dependencies.
3. Create an empty PostgreSQL database owned by the BEOS database role.
4. Restore the database dump into that empty database:

   ```sh
   pg_restore --exit-on-error --no-owner --no-privileges \
     --dbname="$RESTORE_DATABASE_URL" beos-database.dump
   ```

5. Extract the file archive into an empty staging directory, then configure the
   restored API's `FILE_STORAGE_PATH` to that exact restored root. Do not merge
   an archive into a live file directory.
6. Start the restored API with write traffic disabled. Confirm:

   - Prisma reports no pending production migration for the recorded revision.
   - `/api/v1/ready` reports the database connected.
   - An authorized user can list and download several files across each scope.
   - File sizes and SHA-256 values match their `FileRecord` metadata.
   - Notifications and audit history are readable by the appropriate users.

7. Run the relevant unit, API, and browser smoke tests. Only then approve the
   restored environment for traffic.

## Recovery testing and retention

- Perform a test restore on a schedule and record the achieved recovery time and
  recovery point.
- Test at least one company, branch, and department file when those scopes have
  real data.
- Retention, encryption keys, off-site replication, and deletion schedules are
  operational decisions that must be set before production launch. They are not
  inferred by the application.
- Application logs and environment secrets require separate operational backup
  policies; they must not be bundled into the file archive.
