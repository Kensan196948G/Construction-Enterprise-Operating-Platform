FROM node:20-slim AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json* ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
# NEXT_PUBLIC_* vars must be available at BUILD time to be baked into the
# client bundle. Pass via docker-compose build.args; they default to localhost
# for non-Docker dev (npm run build / npm run dev).
ARG NEXT_PUBLIC_AUTH_API=http://localhost:8001
ARG NEXT_PUBLIC_OBJECT_API=http://localhost:8004
ARG NEXT_PUBLIC_WORKFLOW_API=http://localhost:8005
ARG NEXT_PUBLIC_AI_GATEWAY_API=http://localhost:8006
ARG NEXT_PUBLIC_FEDERATION_API=http://localhost:8007
ARG NEXT_PUBLIC_DASHBOARD_API=http://localhost:8009
ARG NEXT_PUBLIC_AUDIT_API=http://localhost:8003
ENV NEXT_PUBLIC_AUTH_API=$NEXT_PUBLIC_AUTH_API
ENV NEXT_PUBLIC_OBJECT_API=$NEXT_PUBLIC_OBJECT_API
ENV NEXT_PUBLIC_WORKFLOW_API=$NEXT_PUBLIC_WORKFLOW_API
ENV NEXT_PUBLIC_AI_GATEWAY_API=$NEXT_PUBLIC_AI_GATEWAY_API
ENV NEXT_PUBLIC_FEDERATION_API=$NEXT_PUBLIC_FEDERATION_API
ENV NEXT_PUBLIC_DASHBOARD_API=$NEXT_PUBLIC_DASHBOARD_API
ENV NEXT_PUBLIC_AUDIT_API=$NEXT_PUBLIC_AUDIT_API
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
