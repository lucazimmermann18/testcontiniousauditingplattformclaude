#!/bin/sh
set -e

echo "[continuum-audit] Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[continuum-audit] Seeding initial data (skipped if DB already populated)..."
node scripts/seed.js

echo "[continuum-audit] Starting server..."
exec node server.js
