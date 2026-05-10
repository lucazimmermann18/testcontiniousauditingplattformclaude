#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Continuum Audit — Server Setup Script
# Run once on a fresh Ubuntu 22.04 / 24.04 Hetzner server as root.
#
# Usage:
#   bash scripts/setup.sh <your-domain> <your-email>
#   e.g.: bash scripts/setup.sh audit.example.com admin@example.com
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:?Usage: bash scripts/setup.sh <domain> <email>}"
EMAIL="${2:?Usage: bash scripts/setup.sh <domain> <email>}"
REPO="https://github.com/lucazimmermann18/testcontiniousauditingplattformclaude"
APP_DIR="/opt/continuum-audit"
BRANCH="claude/style-html-design-JsaKB"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Continuum Audit — Server Setup"
echo "  Domain : $DOMAIN"
echo "  Email  : $EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. System updates ─────────────────────────────────────────────────
echo "▶ System update..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq git curl

# ── 2. Docker ─────────────────────────────────────────────────────────
echo "▶ Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "  Docker already installed."
fi

# ── 3. Clone / update repository ─────────────────────────────────────
echo "▶ Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
  echo "  Directory exists — pulling latest..."
  git -C "$APP_DIR" pull origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# ── 4. Environment file ───────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "▶ Creating .env with auto-generated secrets..."
  cp .env.production.example .env

  AUTH_SECRET=$(openssl rand -base64 32)
  ENC_SECRET=$(openssl rand -base64 32)
  # Replace each REPLACE_ME placeholder sequentially
  sed -i "0,/REPLACE_ME_openssl_rand_-base64_32/s//$(echo $AUTH_SECRET | sed 's/[\/&]/\\&/g')/" .env
  sed -i "0,/REPLACE_ME_openssl_rand_-base64_32/s//$(echo $ENC_SECRET | sed 's/[\/&]/\\&/g')/" .env
  sed -i "s|YOUR_DOMAIN|${DOMAIN}|g" .env

  echo "  ✓ .env created."
else
  echo "  .env already exists — skipping."
fi

# ── 5. Create required directories ───────────────────────────────────
mkdir -p nginx/www nginx/certs

# ── 6. Phase 1: HTTP-only nginx to get SSL cert ───────────────────────
echo "▶ Starting HTTP-only Nginx for ACME challenge..."
cp nginx/nginx.conf nginx/nginx-https.conf.bak   # backup HTTPS template
cp nginx/nginx-init.conf nginx/nginx.conf         # use HTTP-only config
docker compose up -d nginx
sleep 5

# ── 7. Obtain SSL certificate ─────────────────────────────────────────
echo "▶ Requesting Let's Encrypt certificate for $DOMAIN..."
docker compose run --rm certbot \
  certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# ── 8. Phase 2: Switch to HTTPS nginx config ──────────────────────────
echo "▶ Activating HTTPS config..."
cp nginx/nginx-https.conf.bak nginx/nginx.conf
sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" nginx/nginx.conf
docker compose exec nginx nginx -s reload

# ── 9. Build and start all services ───────────────────────────────────
echo "▶ Building and starting all services..."
docker compose up -d --build

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup complete!"
echo ""
echo "  App:        https://$DOMAIN"
echo "  View logs:  docker compose -f $APP_DIR/docker-compose.yml logs -f app"
echo "  Update:     bash $APP_DIR/scripts/deploy.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
