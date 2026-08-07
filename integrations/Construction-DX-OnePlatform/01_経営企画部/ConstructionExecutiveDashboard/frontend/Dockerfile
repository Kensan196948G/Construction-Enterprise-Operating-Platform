# --------------------------------------------------------------------------
# 01 経営ダッシュボード Web (multistage; shared-ui を workspace 経由でビルドする)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 01_経営企画部/ConstructionExecutiveDashboard/frontend/Dockerfile -t cdx-exec-web .
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 01_経営企画部/ConstructionExecutiveDashboard/frontend/package.json \
     ./01_経営企画部/ConstructionExecutiveDashboard/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 01_経営企画部/ConstructionExecutiveDashboard/frontend \
     ./01_経営企画部/ConstructionExecutiveDashboard/frontend
RUN npm -w cdx-exec-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/01_経営企画部/ConstructionExecutiveDashboard/frontend/dist \
     /usr/share/nginx/html
COPY 01_経営企画部/ConstructionExecutiveDashboard/frontend/nginx.conf \
     /etc/nginx/conf.d/default.conf
EXPOSE 80
