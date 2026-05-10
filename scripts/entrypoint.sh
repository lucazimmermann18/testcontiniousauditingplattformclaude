#!/bin/sh
set -e

echo "[continuum-audit] Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[continuum-audit] Starting server..."
exec node server.js
