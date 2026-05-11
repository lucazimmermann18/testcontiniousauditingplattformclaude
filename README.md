# Continuum Audit — Continuous Auditing Platform

A modern, AI-powered internal audit platform for managing KPIs, findings, approval workflows, and audit planning.

## Features

- **KPI Dashboard** — Real-time risk overview, heatmap, trend analysis
- **4-Stage AI Agent** — Automated KPI audits (Scout → Analyst → Cross-Checker → Risk-Rater)
- **Findings & Tasks** — Track audit findings with severity, assignments, and due dates
- **Approval Workflow** — Reviewer → Head-of-Audit two-stage approval with full audit trail
- **Audit Planning** — Quarterly planning with DB-persisted plans, priority management
- **Calendar & Timeline** — Audit schedule and quarterly comparisons
- **Team Management** — Role-based access (Admin, Head of Audit, Reviewer, Owner)
- **AI Assistant** — Chat-based analysis of KPIs and findings

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### 1. Clone and install

```bash
git clone https://github.com/lucazimmermann18/testcontiniousauditingplattformclaude.git
cd testcontiniousauditingplattformclaude
npm install
```

### 2. Configure environment

```bash
cp .env.production.example .env
```

Edit `.env` and set at minimum:

```env
# Local SQLite dev database
DATABASE_URL="file:./prisma/dev.db"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Generate with: openssl rand -base64 32
ENCRYPTION_SECRET="your-encryption-secret-here"
```

### 3. Set up the database

```bash
# Apply all migrations and generate the Prisma client
npx prisma migrate deploy
npm run db:generate

# Seed with demo data (users, KPIs, findings)
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Head of Audit | `a.voss@continuum-audit.de` | `audit2026!` |
| Reviewer | `s.hartmann@continuum-audit.de` | `audit2026!` |
| Process Owner | `m.weiss@continuum-audit.de` | `audit2026!` |
| Admin | `admin@continuum-audit.de` | `admin2026!` |

---

## Database

The project uses **SQLite** locally (via LibSQL adapter) and supports **PostgreSQL** or **Turso** in production.

```bash
npm run db:migrate    # Create & apply a new migration (dev only)
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run db:reset      # Drop + re-migrate + re-seed (dev only — destroys all data)
```

### After pulling new changes

```bash
npx prisma migrate deploy
npm run db:generate
```

---

## AI Agents (optional)

To enable AI-powered KPI audits, add an API key under **Settings → API-Schlüssel**:

- **Anthropic** (Claude) — recommended
- **OpenAI** (GPT-4)
- **Google** (Gemini)

---

## Production Deployment (Docker)

```bash
docker build -t continuum-audit .
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/data/app.db" \
  -e AUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e ENCRYPTION_SECRET="..." \
  -v continuum-data:/data \
  continuum-audit
```

On first start, run inside the container:

```bash
docker exec <container> npx prisma migrate deploy
docker exec <container> npm run db:seed
```

See `.env.production.example` for all options including PostgreSQL, Google OAuth, and Microsoft Entra ID (SSO).

---

## Project Structure

```
prisma/
  schema.prisma          # All data models
  migrations/            # SQL migration history (committed to git)
  seed.ts                # Demo data seeder
src/
  app/                   # Next.js App Router — pages + API routes
  components/            # React UI components
    views/               # Full-page views (Dashboard, Agents, Approvals…)
  lib/                   # DB client, auth, utilities
  types/                 # TypeScript types
```
