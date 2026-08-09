# ---- Civil Construction IMS - API (NestJS) Production Image ----
# Multi-stage build for pnpm monorepo

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- Dependencies (with native build tools for bcrypt) ----
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
COPY packages/types ./packages/types
COPY apps/api ./apps/api
RUN pnpm --filter=api run db:generate
RUN pnpm --filter=api run build
# Prune to production dependencies only
RUN pnpm --filter=api --prod deploy /app/deploy

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
# Non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs
COPY --from=build --chown=nestjs:nodejs /app/deploy/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/apps/api/prisma ./prisma
USER nestjs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "dist/main"]
