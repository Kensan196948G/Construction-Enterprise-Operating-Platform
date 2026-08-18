# ─── Stage 1: Build ──────────────────────────────────────────────────────────
# Installs all dependencies, type-checks, and compiles TypeScript to dist/.
FROM node:22-alpine AS build

LABEL stage=build

WORKDIR /build

# Enable corepack — makes pnpm available at the locked version without a
# separate global install that would pollute the base image.
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# Restore manifests first so this layer is cached unless deps change.
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json ./

RUN pnpm install --frozen-lockfile

# Copy full source after deps are cached.
COPY src ./src
COPY scripts ./scripts

# Type-check + emit compiled JS to dist/.
RUN pnpm run build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
# Minimal production image — only compiled dist/ and the start script are needed.
# The project has zero runtime npm dependencies, so node_modules is NOT copied.
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.version="0.14.2" \
      org.opencontainers.image.authors="kensan1969@gmail.com" \
      org.opencontainers.image.description="Construction Enterprise Operating Platform — governance, portal, field OS, and AI governance coordination layer"

# curl is needed for the HEALTHCHECK instruction below.
RUN apk add --no-cache curl

WORKDIR /app

# Compiled output from build stage.
COPY --from=build /build/dist ./dist

# Source files so scripts/start.ts can import src/ via Node strip-types mode.
# (Node 22.6+ supports --experimental-strip-types natively; no transpiler needed.)
COPY --from=build /build/src ./src
COPY --from=build /build/scripts ./scripts
COPY --from=build /build/package.json ./

# Non-root user for least-privilege security.
RUN addgroup -g 1001 -S ceop && adduser -S -u 1001 -G ceop ceop

# Pre-create the SQLite data directory and hand it to the non-root user
# BEFORE switching away from root. A fresh named volume is mounted root-owned
# by Docker; without this the ceop user cannot write the database file.
RUN mkdir -p /data && chown ceop:ceop /data

USER ceop

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 30 s interval / 10 s timeout / 15 s grace period / 3 retries.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f "http://localhost:${PORT:-3000}/health" || exit 1

CMD ["node", "--experimental-strip-types", "scripts/start.ts"]
