# --------------------------------------------------------------------------
# 08 購買・調達 Web (multistage; shared-ui を workspace 経由でビルドする)
#
# build context は **リポジトリルート** を想定:
#   docker build -f 08_購買部/ProcurementMaterialPlatform/frontend/Dockerfile -t cdx-proc-web .
# --------------------------------------------------------------------------

# ---- shared-ui build ----
FROM node:20-alpine AS shared-ui
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY 00_共通基盤/shared-ui/package.json ./00_共通基盤/shared-ui/package.json
COPY 08_購買部/ProcurementMaterialPlatform/frontend/package.json \
     ./08_購買部/ProcurementMaterialPlatform/frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-fund --no-audit \
    --legacy-peer-deps
COPY 00_共通基盤/shared-ui ./00_共通基盤/shared-ui
RUN npm -w @cdx/shared-ui run build

# ---- frontend build ----
FROM shared-ui AS build
WORKDIR /workspace
COPY 08_購買部/ProcurementMaterialPlatform/frontend \
     ./08_購買部/ProcurementMaterialPlatform/frontend
RUN npm -w cdx-proc-frontend run build

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build \
     /workspace/08_購買部/ProcurementMaterialPlatform/frontend/dist \
     /usr/share/nginx/html
COPY 08_購買部/ProcurementMaterialPlatform/frontend/nginx.conf \
     /etc/nginx/conf.d/default.conf
EXPOSE 80
