# Deployment — Continuum Audit

## Voraussetzungen

- Hetzner VPS (Ubuntu 22.04 oder 24.04), min. 2 GB RAM
- Eine Domain die auf die Server-IP zeigt (DNS A-Record gesetzt)
- SSH-Zugang als root

---

## Erstmaliges Setup (ca. 10 Minuten)

### 1. Auf den Server verbinden

```bash
ssh root@DEINE_SERVER_IP
```

### 2. Setup-Script ausführen

```bash
curl -fsSL https://raw.githubusercontent.com/lucazimmermann18/testcontiniousauditingplattformclaude/claude/style-html-design-JsaKB/scripts/setup.sh | bash -s -- audit.example.com admin@example.com
```

**Ersetze:**
- `audit.example.com` → deine Domain
- `admin@example.com` → deine E-Mail (für Let's Encrypt)

Das Script macht automatisch:
1. Docker installieren
2. Repository klonen
3. `.env` mit generierten Secrets erstellen
4. SSL-Zertifikat per Let's Encrypt holen
5. Nginx mit HTTPS konfigurieren
6. App bauen und starten

### 3. Ersten Admin-Nutzer anlegen

Nach dem Start läuft die App — der Seed-Nutzer wird automatisch beim ersten Start angelegt:

```
E-Mail:    admin@continuum-audit.de
Passwort:  admin123
```

**Passwort sofort ändern** unter `https://deine-domain/profile`.

---

## Updates einspielen

```bash
cd /opt/continuum-audit
bash scripts/deploy.sh
```

---

## Nützliche Befehle

```bash
# Logs anzeigen
docker compose logs -f app

# App neustarten
docker compose restart app

# Alle Container-Status
docker compose ps

# DB-Backup (SQLite)
docker compose cp app:/data/app.db ./backup-$(date +%Y%m%d).db

# Shell in App-Container
docker compose exec app sh
```

---

## Umgebungsvariablen (`.env`)

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | `file:/data/app.db` (nicht ändern) |
| `AUTH_SECRET` | JWT-Signing-Secret (auto-generiert) |
| `NEXTAUTH_URL` | `https://deine-domain` |
| `ENCRYPTION_SECRET` | Verschlüsselung für gespeicherte API-Keys |
| `NODE_ENV` | `production` |

---

## SSL-Zertifikat erneuern

Läuft automatisch über den Certbot-Container alle 12 Stunden. Manuell:

```bash
docker compose run --rm certbot certbot renew
docker compose exec nginx nginx -s reload
```

---

## Backup-Strategie

Die SQLite-Datenbank liegt im Docker-Volume `continuum-audit_db_data`. Tägliches Backup empfohlen:

```bash
# /etc/cron.daily/continuum-audit-backup
#!/bin/bash
cd /opt/continuum-audit
docker compose cp app:/data/app.db /backups/continuum-audit-$(date +%Y%m%d).db
find /backups -name "continuum-audit-*.db" -mtime +30 -delete
```
