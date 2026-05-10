# ── Stage 1: Install all dependencies (including devDeps for build) ──
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 3: Production image ─────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only production dependencies (includes prisma CLI for migrate)
COPY package*.json ./
RUN npm ci --omit=dev

# Standalone Next.js server
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY public ./public

# Prisma: schema + migrations + generated client
COPY prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Startup script
COPY scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
