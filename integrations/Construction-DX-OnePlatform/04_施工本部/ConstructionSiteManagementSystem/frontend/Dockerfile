# --------------------------------------------------------------------------
# 04 施工管理 Web (multistage; shared-ui を workspace 経由でビルドする)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 04_施工本部/.../frontend/Dockerfile -t cdx-site-web .
#
# Compose 側は build.context を `.` に切り替える必要がある。
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 04_施工本部/ConstructionSiteManagementSystem/frontend/package.json \
     ./04_施工本部/ConstructionSiteManagementSystem/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 04_施工本部/ConstructionSiteManagementSystem/frontend \
     ./04_施工本部/ConstructionSiteManagementSystem/frontend
RUN npm -w cdx-site-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/04_施工本部/ConstructionSiteManagementSystem/frontend/dist \
     /usr/share/nginx/html
COPY 04_施工本部/ConstructionSiteManagementSystem/frontend/nginx.conf \
     /etc/nginx/conf.d/default.conf
EXPOSE 80
