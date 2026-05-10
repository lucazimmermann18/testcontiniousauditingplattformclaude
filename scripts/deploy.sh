#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Continuum Audit — Update / Redeploy Script
# Run from /opt/continuum-audit after the initial setup.
#
# Usage:  bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

BRANCH="claude/style-html-design-JsaKB"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Continuum Audit — Deploy"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "▶ Pulling latest code..."
git pull origin "$BRANCH"

echo "▶ Rebuilding app image..."
docker compose build app

echo "▶ Restarting app (zero-downtime swap)..."
docker compose up -d --no-deps app

echo "▶ Cleaning up old images..."
docker image prune -f

echo ""
echo "  ✓ Deploy done — $(date '+%H:%M:%S')"
echo "  Logs: docker compose logs -f app"
