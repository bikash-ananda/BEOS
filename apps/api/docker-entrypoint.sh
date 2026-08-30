#!/bin/sh
set -e

cd /app/apps/api

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Ensuring RBAC roles and permissions..."
node dist/scripts/seed-rbac.js

if [ -n "$BOOTSTRAP_ADMIN_EMAIL" ] && [ -n "$BOOTSTRAP_ADMIN_PASSWORD" ] && [ -n "$BOOTSTRAP_ADMIN_NAME" ]; then
  echo "==> Checking/bootstrapping administrator ($BOOTSTRAP_ADMIN_EMAIL)..."
  node dist/scripts/bootstrap-admin.js || true
fi

echo "==> Starting BEOS API..."
exec "$@"
